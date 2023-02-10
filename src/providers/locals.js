const path = require("path");
const dotenv = require("dotenv");

class Locals {
  /**
   * Initialize all env variables
   */
  static config() {
    dotenv.config({ path: path.join(__dirname, "../../.env") });

    // RECAPTHCA_SITE_SECRET;
    // HASURA_GRAPHQL_UNAUTHORIZED_ROLE;
    // AUTH_GOOGLE_CLIENT_ID;
    // AUTH_GOOGLE_CLIENT_SECRET;

    const authTokenExpiresIn = process.env.AUTH_TOKEN_EXPIRES_IN || "7D";

    const refreshTokenSecret =
      process.env.REFRESH_TOKEN_SECRET || "refresh-token-secret";
    const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "30D";

    const hasuraGraphqlURL = process.env.HASURA_GRAPHQL_URL || "";
    const hasuraAdminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET || "";

    const jwtSecret = process.env.HASURA_GRAPHQL_JWT_SECRET || "";
    const jwtKey = process.env.HASURA_GRAPHQL_JWT_KEY || "";

    const hasuraGraphqlUserRole = process.env.HASURA_GRAPHQL_USER_ROLE || "";

    const authGoogleClientId = process.env.AUTH_GOOGLE_CLIENT_ID || "";
    const authGoogleClientSecret = process.env.AUTH_GOOGLE_CLIENT_SECRET || "";

    return {
      authTokenExpiresIn,
      //
      refreshTokenSecret,
      refreshTokenExpiresIn,
      //
      hasuraAdminSecret,
      hasuraGraphqlURL,
      //
      jwtSecret,
      jwtKey,
      //
      hasuraGraphqlUserRole,
      //
      authGoogleClientId,
      authGoogleClientSecret,
    };
  }

  /**
   * Injects config in app's locals
   */
  static init(_express) {
    _express.locals.app = this.config();
    return _express;
  }
}

module.exports = Locals;
