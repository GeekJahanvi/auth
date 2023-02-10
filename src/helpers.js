const jwt = require("jsonwebtoken");
const Locals = require("./providers/locals");

class Helpers {
  /**
   * Create Token
   */
  async CreateToken(_payload) {
    const expires_in = Locals.config().authTokenExpiresIn;

    const tokenContents = {
      id: _payload.id.toString(),
      "https://hasura.io/jwt/claims": {
        "x-hasura-allowed-roles": _payload.allowed_roles,
        "x-hasura-default-role": _payload.default_role,
        "x-hasura-user-id": _payload.id.toString(),
        "x-hasura-teacher-student-id": _payload.teacher_student_id.toString()
      },
    };

    const token = jwt.sign(tokenContents, Locals.config().jwtSecret, {
      algorithm: Locals.config().jwtKey,
      expiresIn: expires_in,
    });

    const refreshToken = await this.CreateRefreshToken(_payload);

    return {
      token,
      expires_in,
      ...refreshToken,
    };
  }

  /**
   * Create Refresh Token
   */
  async CreateRefreshToken(_payload) {
    const expires_in = Locals.config().refreshTokenExpiresIn;

    const refresh_token = jwt.sign(
      _payload,
      Locals.config().refreshTokenSecret,
      {
        expiresIn: expires_in.toString(),
      },
    );

    return {
      refresh_token,
      refresh_token_expires_in: expires_in,
    };
  }
  /**
   * Verify JWT Token
   */
  verifyJWTToken(token) {
    try {
      const verifiedToken = jwt.verify(token, Locals.config().jwtSecret);
      return { success: true, token: verifiedToken };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}

module.exports = new Helpers();
