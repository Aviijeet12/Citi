const {
  HttpError,
  getUserById,
  mapSystemRoleToRoleCodes,
  normalizeSystemRole,
  recordAudit,
  setUserRoles,
} = require("@workshop/backend-common");

function isBodyEmpty(body) {
  if (!body) {
    return true;
  }
  return typeof body === "object" && Object.keys(body).length === 0;
}

function readRoleFromBody(body) {
  if (isBodyEmpty(body)) {
    throw new HttpError(400, "Request body is required");
  }
  if (!Object.prototype.hasOwnProperty.call(body, "role")) {
    throw new HttpError(400, "role is required");
  }
  return normalizeSystemRole(body.role);
}

function resolveTargetUserId(request) {
  return request?.params?.userId || request?.segments?.[2] || null;
}

function createAdminRoleController({
  fetchUserById = getUserById,
  mapRoleToCodes = mapSystemRoleToRoleCodes,
  writeAudit = recordAudit,
  writeRoleCodes = setUserRoles,
} = {}) {
  return async function updateUserRoleController({ client, request }) {
    const actorAuth = request?.context?.auth;
    if (!actorAuth?.userId) {
      throw new HttpError(401, "Unauthorized");
    }

    if (actorAuth.role !== "ADMIN") {
      console.warn("[AUTHZ] Non-admin attempted role update", { actorUserId: actorAuth.userId, role: actorAuth.role });
      throw new HttpError(403, "Forbidden");
    }

    const targetUserId = resolveTargetUserId(request);
    if (!targetUserId) {
      throw new HttpError(400, "Target user id is required");
    }

    const nextRole = readRoleFromBody(request.body);

    await client.query("BEGIN");
    try {
      const actorResult = await client.query(
        `
          SELECT id, role, status
          FROM users
          WHERE id = $1
          FOR UPDATE
        `,
        [actorAuth.userId]
      );

      if (actorResult.rowCount === 0 || actorResult.rows[0].status !== "active") {
        throw new HttpError(401, "Unauthorized");
      }

      if (actorResult.rows[0].role !== "ADMIN") {
        console.warn("[AUTHZ] Stale/non-admin role update attempt", { actorUserId: actorAuth.userId, role: actorResult.rows[0].role });
        throw new HttpError(403, "Forbidden");
      }

      const targetResult = await client.query(
        `
          SELECT id, email, role, is_system_critical
          FROM users
          WHERE id = $1
          FOR UPDATE
        `,
        [targetUserId]
      );

      if (targetResult.rowCount === 0) {
        throw new HttpError(404, "User not found");
      }

      const targetUser = targetResult.rows[0];

      if (targetUser.is_system_critical && nextRole !== targetUser.role) {
        throw new HttpError(403, "System-critical accounts cannot be modified");
      }

      if (targetUser.id === actorAuth.userId && nextRole !== "ADMIN") {
        const adminCountResult = await client.query(
          `
            SELECT COUNT(*)::int AS count
            FROM users
            WHERE role = 'ADMIN' AND status = 'active'
          `
        );

        if (adminCountResult.rows[0].count <= 1) {
          throw new HttpError(400, "Cannot remove ADMIN role from the last active admin");
        }
      }

      await client.query(
        `
          UPDATE users
          SET role = $2,
              updated_at = NOW()
          WHERE id = $1
        `,
        [targetUserId, nextRole]
      );

      await writeRoleCodes(client, targetUserId, mapRoleToCodes(nextRole));

      const updatedUser = await fetchUserById(client, targetUserId);

      await writeAudit(client, actorAuth.userId, "users.role.update", "user", targetUserId, {
        previous_role: targetUser.role,
        next_role: nextRole,
      });

      await client.query("COMMIT");
      return updatedUser;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  };
}

const updateUserRoleController = createAdminRoleController();

module.exports = {
  createAdminRoleController,
  updateUserRoleController,
};
