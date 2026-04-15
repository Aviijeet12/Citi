const assert = require("node:assert/strict");
const test = require("node:test");
const crypto = require("crypto");

const {
  HttpError,
  authenticateTokenPayload,
  getPool,
  handleError,
} = require("@workshop/backend-common");
const { createJwtAuthenticationMiddleware } = require("../middleware/authentication");
const { authorizeRoles } = require("../middleware/authorization");
const { createAdminRoleController } = require("../controllers/adminRoleController");

const JWT_SECRET = process.env.JWT_SECRET || "local-dev-jwt-secret-change-me";

function createBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signToken(payload) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = createBase64Url(JSON.stringify(header));
  const encodedBody = createBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function createAccessToken({ userId = "user-1", role = "USER", expiresInSeconds = 3600 } = {}) {
  const now = Math.floor(Date.now() / 1000);
  return signToken({
    sub: userId,
    role,
    type: "access",
    iat: now,
    exp: now + expiresInSeconds,
  });
}

function createMockDbClient({ actor, target, adminCount = 2, failOnUpdate = false } = {}) {
  const calls = [];
  const targetState = target ? { ...target } : null;

  const client = {
    calls,
    async query(sql, params = []) {
      const normalized = String(sql).replace(/\s+/g, " ").trim().toLowerCase();
      calls.push({ sql: normalized, params });

      if (normalized === "begin" || normalized === "commit" || normalized === "rollback") {
        return { rowCount: 0, rows: [] };
      }

      if (normalized.includes("from users") && normalized.includes("where id = $1") && normalized.includes("for update")) {
        const id = params[0];
        if (actor && id === actor.id) {
          return { rowCount: 1, rows: [{ ...actor }] };
        }
        if (targetState && id === targetState.id) {
          return { rowCount: 1, rows: [{ ...targetState }] };
        }
        return { rowCount: 0, rows: [] };
      }

      if (normalized.includes("select count(*)::int as count") && normalized.includes("from users")) {
        return { rowCount: 1, rows: [{ count: adminCount }] };
      }

      if (normalized.startsWith("update users") && normalized.includes("set role")) {
        if (failOnUpdate) {
          throw new Error("simulated db update error");
        }
        if (targetState) {
          targetState.role = params[1];
        }
        return { rowCount: 1, rows: [] };
      }

      throw new Error(`Unhandled SQL in test double: ${normalized}`);
    },
  };

  return { client, calls, targetState };
}

function createControllerAndSpies(dbSetup) {
  const roleCodeWrites = [];
  const auditWrites = [];

  const controller = createAdminRoleController({
    fetchUserById: async (_client, userId) => ({
      id: userId,
      role: dbSetup.targetState?.role || "USER",
      email: dbSetup.targetState?.email || "target@example.com",
    }),
    mapRoleToCodes: (role) => {
      if (role === "ADMIN") return ["admin"];
      if (role === "MANAGER") return ["manager"];
      return ["viewer"];
    },
    writeRoleCodes: async (_client, userId, roleCodes) => {
      roleCodeWrites.push({ userId, roleCodes });
    },
    writeAudit: async (_client, actorUserId, action, entityType, entityId, details) => {
      auditWrites.push({ actorUserId, action, entityType, entityId, details });
    },
  });

  return { controller, roleCodeWrites, auditWrites };
}

async function assertHttpError(fn, statusCode, messageContains) {
  try {
    await Promise.resolve().then(fn);
    assert.fail("Expected HttpError but function succeeded");
  } catch (error) {
    assert.equal(error instanceof HttpError, true);
    assert.equal(error.statusCode, statusCode);
    if (messageContains) {
      assert.match(error.message, new RegExp(messageContains));
    }
  }
}

function withWarnSpy(run) {
  const originalWarn = console.warn;
  const warnings = [];
  console.warn = (...args) => warnings.push(args);
  return Promise.resolve()
    .then(() => run(warnings))
    .finally(() => {
      console.warn = originalWarn;
    });
}

test("1. Valid JWT -> request succeeds", async () => {
  const middleware = createJwtAuthenticationMiddleware({
    authenticateJwtPayload: authenticateTokenPayload,
  });
  const token = createAccessToken({ userId: "u-100", role: "ADMIN" });
  const request = { headers: { authorization: `Bearer ${token}` } };

  await middleware({ request });

  assert.deepEqual(request.context.auth, { userId: "u-100", role: "ADMIN" });
});

test("2. Missing JWT -> 401 Unauthorized", async () => {
  const middleware = createJwtAuthenticationMiddleware({
    authenticateJwtPayload: authenticateTokenPayload,
  });
  const request = { headers: {} };

  await assertHttpError(() => middleware({ request }), 401, "Authorization header is required");
});

test("3. Invalid JWT -> 401 Unauthorized", async () => {
  const middleware = createJwtAuthenticationMiddleware({
    authenticateJwtPayload: authenticateTokenPayload,
  });
  const request = { headers: { authorization: "Bearer not.a.valid.token" } };

  await assertHttpError(() => middleware({ request }), 401);
});

test("4. Expired JWT -> 401 Unauthorized", async () => {
  const middleware = createJwtAuthenticationMiddleware({
    authenticateJwtPayload: authenticateTokenPayload,
  });
  const token = createAccessToken({ userId: "u-100", role: "ADMIN", expiresInSeconds: -60 });
  const request = { headers: { authorization: `Bearer ${token}` } };

  await assertHttpError(() => middleware({ request }), 401, "Token expired");
});

test("5. Malformed Authorization header -> 401", async () => {
  const middleware = createJwtAuthenticationMiddleware({
    authenticateJwtPayload: authenticateTokenPayload,
  });
  const request = { headers: { authorization: "Token abc" } };

  await assertHttpError(() => middleware({ request }), 401, "Malformed authorization header");
});

test("6. ADMIN accessing admin endpoint -> allowed", async () => {
  const request = { context: { auth: { userId: "a-1", role: "ADMIN" } } };
  const check = authorizeRoles(["ADMIN"]);

  assert.equal(check({ request }), true);
});

test("7. MANAGER accessing admin endpoint -> 403", async () => {
  const request = { context: { auth: { userId: "m-1", role: "MANAGER" } } };
  const check = authorizeRoles(["ADMIN"]);

  await assertHttpError(() => Promise.resolve(check({ request })), 403, "Forbidden");
});

test("8. USER accessing admin endpoint -> 403", async () => {
  const request = { context: { auth: { userId: "u-1", role: "USER" } } };
  const check = authorizeRoles(["ADMIN"]);

  await assertHttpError(() => Promise.resolve(check({ request })), 403, "Forbidden");
});

test("9. ADMIN accessing user endpoint -> allowed", async () => {
  const request = { context: { auth: { userId: "a-1", role: "ADMIN" } } };
  const check = authorizeRoles(["ADMIN", "USER"]);

  assert.equal(check({ request }), true);
});

test("10. USER accessing manager-only endpoint -> 403", async () => {
  const request = { context: { auth: { userId: "u-1", role: "USER" } } };
  const check = authorizeRoles(["MANAGER", "ADMIN"]);

  await assertHttpError(() => Promise.resolve(check({ request })), 403, "Forbidden");
});

test("11. ADMIN updates USER -> MANAGER -> success", async () => {
  const db = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: { id: "user-1", email: "user@example.com", role: "USER", is_system_critical: false },
  });
  const { controller, roleCodeWrites } = createControllerAndSpies(db);

  const updated = await controller({
    client: db.client,
    request: {
      params: { userId: "user-1" },
      body: { role: "MANAGER" },
      context: { auth: { userId: "admin-1", role: "ADMIN" } },
    },
  });

  assert.equal(updated.role, "MANAGER");
  assert.deepEqual(roleCodeWrites[0], { userId: "user-1", roleCodes: ["manager"] });
});

test("12. ADMIN updates MANAGER -> USER -> success", async () => {
  const db = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: { id: "manager-1", email: "manager@example.com", role: "MANAGER", is_system_critical: false },
  });
  const { controller, roleCodeWrites } = createControllerAndSpies(db);

  const updated = await controller({
    client: db.client,
    request: {
      params: { userId: "manager-1" },
      body: { role: "USER" },
      context: { auth: { userId: "admin-1", role: "ADMIN" } },
    },
  });

  assert.equal(updated.role, "USER");
  assert.deepEqual(roleCodeWrites[0], { userId: "manager-1", roleCodes: ["viewer"] });
});

test("13. ADMIN updates to invalid role -> 400", async () => {
  const db = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: { id: "user-1", email: "user@example.com", role: "USER", is_system_critical: false },
  });
  const { controller } = createControllerAndSpies(db);

  await assertHttpError(
    () => controller({
      client: db.client,
      request: {
        params: { userId: "user-1" },
        body: { role: "SUPER_ADMIN" },
        context: { auth: { userId: "admin-1", role: "ADMIN" } },
      },
    }),
    400,
    "role must be one of USER, MANAGER, ADMIN"
  );
});

test("14. Non-admin tries role update -> 403", async () => {
  const db = createMockDbClient({
    actor: { id: "manager-1", role: "MANAGER", status: "active" },
    target: { id: "user-1", email: "user@example.com", role: "USER", is_system_critical: false },
  });
  const { controller } = createControllerAndSpies(db);

  await assertHttpError(
    () => controller({
      client: db.client,
      request: {
        params: { userId: "user-1" },
        body: { role: "MANAGER" },
        context: { auth: { userId: "manager-1", role: "MANAGER" } },
      },
    }),
    403,
    "Forbidden"
  );
});

test("15. Update non-existent user -> 404", async () => {
  const db = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: null,
  });
  const { controller } = createControllerAndSpies(db);

  await assertHttpError(
    () => controller({
      client: db.client,
      request: {
        params: { userId: "missing-user" },
        body: { role: "MANAGER" },
        context: { auth: { userId: "admin-1", role: "ADMIN" } },
      },
    }),
    404,
    "User not found"
  );
});

test("16. Prevent privilege escalation: MANAGER and USER cannot assign ADMIN", async () => {
  const db = createMockDbClient({
    actor: { id: "manager-1", role: "MANAGER", status: "active" },
    target: { id: "user-1", email: "user@example.com", role: "USER", is_system_critical: false },
  });
  const { controller } = createControllerAndSpies(db);

  await assertHttpError(
    () => controller({
      client: db.client,
      request: {
        params: { userId: "user-1" },
        body: { role: "ADMIN" },
        context: { auth: { userId: "manager-1", role: "MANAGER" } },
      },
    }),
    403,
    "Forbidden"
  );

  await assertHttpError(
    () => controller({
      client: db.client,
      request: {
        params: { userId: "user-1" },
        body: { role: "ADMIN" },
        context: { auth: { userId: "user-2", role: "USER" } },
      },
    }),
    403,
    "Forbidden"
  );
});

test("17. Prevent self-demotion when actor is only admin", async () => {
  const db = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: { id: "admin-1", email: "admin@example.com", role: "ADMIN", is_system_critical: false },
    adminCount: 1,
  });
  const { controller } = createControllerAndSpies(db);

  await assertHttpError(
    () => controller({
      client: db.client,
      request: {
        params: { userId: "admin-1" },
        body: { role: "USER" },
        context: { auth: { userId: "admin-1", role: "ADMIN" } },
      },
    }),
    400,
    "Cannot remove ADMIN role from the last active admin"
  );
});

test("18. Prevent modifying system-critical admin account", async () => {
  const db = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: { id: "critical-admin", email: "root@example.com", role: "ADMIN", is_system_critical: true },
  });
  const { controller } = createControllerAndSpies(db);

  await assertHttpError(
    () => controller({
      client: db.client,
      request: {
        params: { userId: "critical-admin" },
        body: { role: "MANAGER" },
        context: { auth: { userId: "admin-1", role: "ADMIN" } },
      },
    }),
    403,
    "System-critical accounts cannot be modified"
  );
});

test("19. Empty request body -> 400", async () => {
  const db = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: { id: "user-1", email: "user@example.com", role: "USER", is_system_critical: false },
  });
  const { controller } = createControllerAndSpies(db);

  await assertHttpError(
    () => controller({
      client: db.client,
      request: {
        params: { userId: "user-1" },
        body: {},
        context: { auth: { userId: "admin-1", role: "ADMIN" } },
      },
    }),
    400,
    "Request body is required"
  );
});

test("20. Missing role field -> 400", async () => {
  const db = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: { id: "user-1", email: "user@example.com", role: "USER", is_system_critical: false },
  });
  const { controller } = createControllerAndSpies(db);

  await assertHttpError(
    () => controller({
      client: db.client,
      request: {
        params: { userId: "user-1" },
        body: { unrelated: true },
        context: { auth: { userId: "admin-1", role: "ADMIN" } },
      },
    }),
    400,
    "role is required"
  );
});

test("21. Invalid role string (case-sensitive) -> 400", async () => {
  const db = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: { id: "user-1", email: "user@example.com", role: "USER", is_system_critical: false },
  });
  const { controller } = createControllerAndSpies(db);

  await assertHttpError(
    () => controller({
      client: db.client,
      request: {
        params: { userId: "user-1" },
        body: { role: "admin" },
        context: { auth: { userId: "admin-1", role: "ADMIN" } },
      },
    }),
    400,
    "role must be one of USER, MANAGER, ADMIN"
  );
});

test("22. Simultaneous role updates use row-level lock query", async () => {
  const dbOne = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: { id: "user-1", email: "user@example.com", role: "USER", is_system_critical: false },
  });
  const dbTwo = createMockDbClient({
    actor: { id: "admin-2", role: "ADMIN", status: "active" },
    target: { id: "user-1", email: "user@example.com", role: "USER", is_system_critical: false },
  });

  const one = createControllerAndSpies(dbOne).controller({
    client: dbOne.client,
    request: {
      params: { userId: "user-1" },
      body: { role: "MANAGER" },
      context: { auth: { userId: "admin-1", role: "ADMIN" } },
    },
  });

  const two = createControllerAndSpies(dbTwo).controller({
    client: dbTwo.client,
    request: {
      params: { userId: "user-1" },
      body: { role: "USER" },
      context: { auth: { userId: "admin-2", role: "ADMIN" } },
    },
  });

  await Promise.all([one, two]);

  const lockQueryExistsOne = dbOne.calls.some((entry) => entry.sql.includes("for update"));
  const lockQueryExistsTwo = dbTwo.calls.some((entry) => entry.sql.includes("for update"));

  assert.equal(lockQueryExistsOne, true);
  assert.equal(lockQueryExistsTwo, true);
});

test("23. Transaction safety: rollback on failure", async () => {
  const db = createMockDbClient({
    actor: { id: "admin-1", role: "ADMIN", status: "active" },
    target: { id: "user-1", email: "user@example.com", role: "USER", is_system_critical: false },
    failOnUpdate: true,
  });
  const { controller } = createControllerAndSpies(db);

  await assert.rejects(() =>
    controller({
      client: db.client,
      request: {
        params: { userId: "user-1" },
        body: { role: "MANAGER" },
        context: { auth: { userId: "admin-1", role: "ADMIN" } },
      },
    })
  );

  const began = db.calls.some((entry) => entry.sql === "begin");
  const rolledBack = db.calls.some((entry) => entry.sql === "rollback");

  assert.equal(began, true);
  assert.equal(rolledBack, true);
});

test("24. Role column constraint enforcement exists in schema bootstrap", async () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const backendCommonPath = path.resolve(__dirname, "../../../packages/backend-common/index.js");
  const source = fs.readFileSync(backendCommonPath, "utf8");

  assert.match(source, /users_role_check/);
  assert.match(source, /role IN \('USER', 'MANAGER', 'ADMIN'\)/);
});

test("25. Handle DB connection errors gracefully via consistent error formatter", () => {
  const response = handleError(new Error("database unavailable"));
  const payload = JSON.parse(response.body);

  assert.equal(response.statusCode, 500);
  assert.equal(payload.message, "Internal server error");
});

test("26. Reuse DB connections in Lambda runtime", () => {
  const firstPool = getPool();
  const secondPool = getPool();

  assert.equal(firstPool, secondPool);
});

test("27. Avoid creating a new DB connection pool per request", () => {
  const poolOne = getPool();
  const poolTwo = getPool();
  const poolThree = getPool();

  assert.equal(poolOne, poolTwo);
  assert.equal(poolTwo, poolThree);
});

test("28. Log unauthorized attempts", async () => {
  await withWarnSpy(async (warnings) => {
    const request = { context: { auth: { userId: "user-1", role: "USER" } } };
    const check = authorizeRoles(["ADMIN"]);

    await assertHttpError(() => Promise.resolve(check({ request })), 403, "Forbidden");
    assert.equal(warnings.length > 0, true);
  });
});

test("29. Error response format is consistent with message field", () => {
  const response = handleError(new HttpError(403, "Forbidden"));
  const payload = JSON.parse(response.body);

  assert.deepEqual(payload, {
    message: "Forbidden",
    details: null,
  });
});
