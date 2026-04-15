const {
  HttpError,
  created,
  ensureSchema,
  getPool,
  getRequest,
  handleError,
  noContent,
  ok,
  parseBoolean,
  recordAudit,
  requireFields,
  requirePermission,
} = require("@workshop/backend-common");

const SERVICE_NAME = "teams-service";

async function getTeam(client, teamId) {
  const teamResult = await client.query(
    `
      SELECT t.id, t.name, t.description, t.location, t.leader_user_id, t.org_leader_name,
             t.created_at, t.updated_at,
             u.display_name AS leader_name
      FROM teams t
      LEFT JOIN users u ON u.id = t.leader_user_id
      WHERE t.id = $1
    `,
    [teamId]
  );
  if (teamResult.rowCount === 0) {
    return null;
  }

  const membersResult = await client.query(
    `
      SELECT tm.team_id, tm.user_id, tm.role_title, tm.location, tm.is_direct_staff, tm.is_leader,
             u.display_name, u.email, u.status
      FROM team_members tm
      JOIN users u ON u.id = tm.user_id
      WHERE tm.team_id = $1
      ORDER BY tm.is_leader DESC, u.display_name ASC
    `,
    [teamId]
  );

  return {
    ...teamResult.rows[0],
    members: membersResult.rows,
  };
}

exports.handler = async (event) => {
  if ((event.requestContext?.http?.method || event.httpMethod) === "OPTIONS") {
    return ok({ service: SERVICE_NAME });
  }

  try {
    await ensureSchema();
    const request = getRequest(event, SERVICE_NAME);
    const pool = getPool();
    const client = await pool.connect();

    try {
      if (request.method === "GET" && request.segments.length === 0) {
        await requirePermission(client, request.headers, "teams.read");
        const filters = [];
        const values = [];
        if (request.query.q) {
          values.push(`%${String(request.query.q).trim().toLowerCase()}%`);
          filters.push(`(LOWER(t.name) LIKE $${values.length} OR LOWER(COALESCE(t.description, '')) LIKE $${values.length})`);
        }
        if (request.query.location) {
          values.push(String(request.query.location).trim().toLowerCase());
          filters.push(`LOWER(COALESCE(t.location, '')) = $${values.length}`);
        }
        const result = await client.query(
          `
            SELECT t.id, t.name, t.description, t.location, t.leader_user_id, t.org_leader_name,
                   u.display_name AS leader_name,
                   COUNT(tm.user_id)::INT AS member_count
            FROM teams t
            LEFT JOIN users u ON u.id = t.leader_user_id
            LEFT JOIN team_members tm ON tm.team_id = t.id
            ${filters.length ? `WHERE ${filters.join(" AND ")}` : ""}
            GROUP BY t.id, u.display_name
            ORDER BY t.created_at DESC
          `,
          values
        );
        return ok({ items: result.rows });
      }

      if (request.method === "GET" && request.segments.length === 1) {
        await requirePermission(client, request.headers, "teams.read");
        const team = await getTeam(client, request.segments[0]);
        if (!team) {
          throw new HttpError(404, "Team not found");
        }
        return ok({ item: team });
      }

      if (request.method === "POST" && request.segments.length === 0) {
        const actor = await requirePermission(client, request.headers, "teams.write");
        requireFields(request.body, ["name"]);

        await client.query("BEGIN");
        try {
          const insert = await client.query(
            `
              INSERT INTO teams (name, description, location, leader_user_id, org_leader_name, created_by, updated_by)
              VALUES ($1, $2, $3, $4, $5, $6, $6)
              RETURNING id
            `,
            [
              String(request.body.name).trim(),
              request.body.description || null,
              request.body.location || null,
              request.body.leader_user_id || null,
              request.body.org_leader_name || null,
              actor.id,
            ]
          );

          const teamId = insert.rows[0].id;
          const members = Array.isArray(request.body.members) ? request.body.members : [];
          for (const member of members) {
            requireFields(member, ["user_id"]);
            await client.query(
              `
                INSERT INTO team_members (team_id, user_id, role_title, location, is_direct_staff, is_leader)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (team_id, user_id) DO UPDATE
                SET role_title = EXCLUDED.role_title,
                    location = EXCLUDED.location,
                    is_direct_staff = EXCLUDED.is_direct_staff,
                    is_leader = EXCLUDED.is_leader,
                    updated_at = NOW()
              `,
              [
                teamId,
                member.user_id,
                member.role_title || null,
                member.location || null,
                parseBoolean(member.is_direct_staff, true),
                parseBoolean(member.is_leader, false),
              ]
            );
          }

          if (request.body.leader_user_id) {
            await client.query(
              `
                INSERT INTO team_members (team_id, user_id, is_leader, is_direct_staff)
                VALUES ($1, $2, TRUE, TRUE)
                ON CONFLICT (team_id, user_id) DO UPDATE
                SET is_leader = TRUE,
                    updated_at = NOW()
              `,
              [teamId, request.body.leader_user_id]
            );
          }

          await recordAudit(client, actor.id, "teams.create", "team", teamId, request.body);
          await client.query("COMMIT");
          return created({ item: await getTeam(client, teamId) });
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }

      if (request.method === "PUT" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "teams.write");
        const teamId = request.segments[0];
        const team = await getTeam(client, teamId);
        if (!team) {
          throw new HttpError(404, "Team not found");
        }
        await client.query(
          `
            UPDATE teams
            SET name = $2,
                description = $3,
                location = $4,
                leader_user_id = $5,
                org_leader_name = $6,
                updated_by = $7,
                updated_at = NOW()
            WHERE id = $1
          `,
          [
            teamId,
            request.body.name ? String(request.body.name).trim() : team.name,
            request.body.description ?? team.description,
            request.body.location ?? team.location,
            request.body.leader_user_id ?? team.leader_user_id,
            request.body.org_leader_name ?? team.org_leader_name,
            actor.id,
          ]
        );
        await recordAudit(client, actor.id, "teams.update", "team", teamId, request.body);
        return ok({ item: await getTeam(client, teamId) });
      }

      if (request.method === "DELETE" && request.segments.length === 1) {
        const actor = await requirePermission(client, request.headers, "teams.delete");
        const teamId = request.segments[0];
        const team = await getTeam(client, teamId);
        if (!team) {
          throw new HttpError(404, "Team not found");
        }
        await client.query("DELETE FROM teams WHERE id = $1", [teamId]);
        await recordAudit(client, actor.id, "teams.delete", "team", teamId, { name: team.name });
        return noContent();
      }

      if (request.method === "POST" && request.segments.length === 2 && request.segments[1] === "members") {
        const actor = await requirePermission(client, request.headers, "teams.write");
        const teamId = request.segments[0];
        requireFields(request.body, ["user_id"]);
        await client.query(
          `
            INSERT INTO team_members (team_id, user_id, role_title, location, is_direct_staff, is_leader)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (team_id, user_id) DO UPDATE
            SET role_title = EXCLUDED.role_title,
                location = EXCLUDED.location,
                is_direct_staff = EXCLUDED.is_direct_staff,
                is_leader = EXCLUDED.is_leader,
                updated_at = NOW()
          `,
          [
            teamId,
            request.body.user_id,
            request.body.role_title || null,
            request.body.location || null,
            parseBoolean(request.body.is_direct_staff, true),
            parseBoolean(request.body.is_leader, false),
          ]
        );
        await recordAudit(client, actor.id, "teams.member.upsert", "team", teamId, request.body);
        return ok({ item: await getTeam(client, teamId) });
      }

      if (request.method === "PUT" && request.segments.length === 3 && request.segments[1] === "members") {
        const actor = await requirePermission(client, request.headers, "teams.write");
        const teamId = request.segments[0];
        const userId = request.segments[2];
        const existing = await client.query("SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2", [teamId, userId]);
        if (existing.rowCount === 0) {
          throw new HttpError(404, "Team member not found");
        }
        const current = existing.rows[0];
        await client.query(
          `
            UPDATE team_members
            SET role_title = $3,
                location = $4,
                is_direct_staff = $5,
                is_leader = $6,
                updated_at = NOW()
            WHERE team_id = $1 AND user_id = $2
          `,
          [
            teamId,
            userId,
            request.body.role_title ?? current.role_title,
            request.body.location ?? current.location,
            request.body.is_direct_staff === undefined ? current.is_direct_staff : parseBoolean(request.body.is_direct_staff),
            request.body.is_leader === undefined ? current.is_leader : parseBoolean(request.body.is_leader),
          ]
        );
        await recordAudit(client, actor.id, "teams.member.update", "team", teamId, { user_id: userId, ...request.body });
        return ok({ item: await getTeam(client, teamId) });
      }

      if (request.method === "DELETE" && request.segments.length === 3 && request.segments[1] === "members") {
        const actor = await requirePermission(client, request.headers, "teams.write");
        const teamId = request.segments[0];
        const userId = request.segments[2];
        await client.query("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2", [teamId, userId]);
        await recordAudit(client, actor.id, "teams.member.delete", "team", teamId, { user_id: userId });
        return ok({ item: await getTeam(client, teamId) });
      }

      throw new HttpError(404, "Route not found");
    } finally {
      client.release();
    }
  } catch (error) {
    return handleError(error);
  }
};
