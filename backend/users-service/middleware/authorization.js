const { HttpError, normalizeSystemRole } = require("@workshop/backend-common");

function authorizeRoles(allowedRoles) {
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    throw new HttpError(500, "allowedRoles must be a non-empty array");
  }

  const normalizedAllowedRoles = allowedRoles.map((role) => normalizeSystemRole(role));

  return ({ request }) => {
    const currentRole = request?.context?.auth?.role;
    if (!currentRole) {
      console.warn("[AUTHZ] Missing role in request context");
      throw new HttpError(403, "Forbidden");
    }

    if (!normalizedAllowedRoles.includes(currentRole)) {
      console.warn("[AUTHZ] Role denied", {
        role: currentRole,
        allowedRoles: normalizedAllowedRoles,
      });
      throw new HttpError(403, "Forbidden");
    }

    return true;
  };
}

module.exports = {
  authorizeRoles,
};
