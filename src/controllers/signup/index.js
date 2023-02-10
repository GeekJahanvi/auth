const bcryptjs = require("bcryptjs");
const Queries = require("../../graphql/queries");
const Mutations = require("../../graphql/mutations");
const Common = require("../../commons");
const Helpers = require("../../helpers");
const Locals = require("../../providers/locals");

async function createUser(name, email, hashPswd, profile_picture_url, role) {
  const { data, error } = await Common.createAction(
    {
      name: name,
      email: email.toLowerCase(),
      profile_picture_url: profile_picture_url ? profile_picture_url : null,
      password: hashPswd,
      role
    },
    Mutations.INSERT_USERS_ONE,
    "insert_users_one",
  );
  return { userData: data, userErrors: error };
}

const Signup = {
  async handle(req, res) {
    try {
      const { email, name, password, profile_picture_url } =
        req.body?.input?.input || req?.body?.input || req?.body;

      const hashPswd = await bcryptjs.hash(password, 12);
      const role = await Common.fetchUserRole(process.env.DEFAULT_SIGN_UP_USER_ROLE_KEY);
      const { userData, userErrors } = await createUser(
        name,
        email,
        hashPswd,
        profile_picture_url,
        role
      );

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

      return Common.Response(res, true, "Signup successfull!", {
        ...userData,
        token: token.token,
        expires_in: token.expires_in,
        refresh_token: token.refresh_token,
        refresh_token_expires_in: token.refresh_token_expires_in,
      });
    } catch (e) {
      return res.status(200).json({ status: false, message: "eerrrere" });
    }
  },
};

module.exports = Signup;
