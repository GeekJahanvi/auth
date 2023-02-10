const Queries = require("../../graphql/queries");
const Mutations = require("../../graphql/mutations");
const Common = require("../../commons");
const Helpers = require("../../helpers");
const Locals = require("../../providers/locals");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { OAuth2Client } = require("google-auth-library");

async function resolveUser(email) {
  let { data, error } = await Common.createAction(
    {
      email: email.toLowerCase(),
    },
    Queries.USER_BY_EMAIL,
    "users",
  );

  if (!data.length) {
    error = "No user registered with this email address";
  }

  return { userData: data[0], userErrors: error };
}

async function verifyGoogleAuth(access_token) {
  const googleClient = new OAuth2Client({
    clientId: Locals.config().authGoogleClientId,
  });
  const tokenObj = JSON.parse(access_token);
  const { id_token } = tokenObj;

  const ticket = await googleClient.verifyIdToken({
    audience: Locals.config().authGoogleClientId,
    idToken: id_token,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    return false;
  }
  return true;
}

async function getAppleSigningKey(kid) {
  const client = jwksClient({
    jwksUri: "https://appleid.apple.com/auth/keys",
  });

  return new Promise((resolve) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        console.error(err);
        resolve(null);
      }
      const signingKey = key.getPublicKey();
      resolve(signingKey);
    });
  });
}

function verifyJWT(json, publicKey) {
  return new Promise((resolve) => {
    jwt.verify(json, publicKey, (err, payload) => {
      if (err) {
        console.error(err);
        return resolve(null);
      }
      resolve(payload);
    });
  });
}

async function verifyAppleAuth(access_token) {
  let isVerified = false;
  const tokenObj = JSON.parse(access_token);
  const { identityToken, user } = tokenObj;
  const json = jwt.decode(identityToken, { complete: true });

  const kid = json?.header?.kid;

  const appleKey = await getAppleSigningKey(kid);

  if (!appleKey) {
    console.error("Something went wrong.");
    return isVerified;
  }

  const payload = await verifyJWT(identityToken, appleKey);

  if (!payload) {
    console.error("Something went wrong.");
    return isVerified;
  }

  if (payload.sub === user && payload.aud == "host.exp.Exponent") {//app.aud.need.to.auth
    isVerified = true;
    // correct user
    // correct auth against app
    // user is legit
  }

  return isVerified;
}

const SocialSignin = {
  async handle(req, res) {
    try {
      const { email, access_token, provider_type } =
        req.body?.input?.input || req?.body?.input || req?.body;

      if (!email) {
        return res
          .status(200)
          .json({ status: false, message: "email not found!" });
      }

      let isUserVerified = true;
      switch (provider_type) {
        case "google":
          isUserVerified = await verifyGoogleAuth(access_token);
          break;
        case "apple":
          isUserVerified = await verifyAppleAuth(access_token);
          break;
      }

      if (!isUserVerified) {
        return res
          .status(200)
          .json({ status: false, message: "User verification failed!" });
      }

      const { userData, userErrors } = await resolveUser(email);

      if (userErrors) {
        return res.status(200).json({ status: false, message: userErrors });
      }

      const { teacherStudentId, error } = await Common.getTeacherStudent(userData.id, userData.role);
      if(error) {
        return res
          .status(200)
          .json({ status: false, message: error });
      }
      const token = await Helpers.CreateToken({
        id: userData.id,
        allowed_roles: [userData.role],
        default_role: userData.role,
        teacher_student_id: teacherStudentId
      });

      delete userData.password;
      return Common.Response(res, true, "SignIn successfull!", {
        ...userData,
        token: token.token,
        expires_in: token.expires_in,
        refresh_token: token.refresh_token,
        refresh_token_expires_in: token.refresh_token_expires_in,
      });
    } catch (e) {
      return res
        .status(200)
        .json({ status: false, message: "Something went wrong." });
    }
  },
};

module.exports = SocialSignin;
