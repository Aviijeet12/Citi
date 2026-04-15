const { authenticateTokenPayload, HttpError } = require("@workshop/backend-common");

function createJwtAuthenticationMiddleware({ authenticateJwtPayload = authenticateTokenPayload } = {}) {
  return async function jwtAuthenticationMiddleware({ request }) {
    if (!request) {
      throw new HttpError(500, "Request context is required");
    }

    const authPayload = authenticateJwtPayload(request.headers || {});

    request.context = request.context || {};
    request.context.auth = {
      userId: authPayload.userId,
      role: authPayload.role,
    };
    request.context.tokenPayload = authPayload.tokenPayload;

    return request.context.auth;
  };
}

const jwtAuthenticationMiddleware = createJwtAuthenticationMiddleware();

module.exports = {
  createJwtAuthenticationMiddleware,
  jwtAuthenticationMiddleware,
};
