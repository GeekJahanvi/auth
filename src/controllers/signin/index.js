const bcryptjs = require("bcryptjs");
const Queries = require("../../graphql/queries");
const Common = require("../../commons");
const Helpers = require("../../helpers");
const Locals = require("../../providers/locals");

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

const Signin = {
  async handle(req, res) {
    try {
      const { email, password } =
        req.body?.input?.input || req?.body?.input || req?.body;

      const { userData, userErrors } = await resolveUser(email);

      if (userErrors) {
        return res.status(200).json({ status: false, message: userErrors });
      }

      const validPassword = await bcryptjs.compare(password, userData.password);

      if (!validPassword) {
        return res
          .status(200)
          .json({ status: false, message: "Invalid Password" });
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
      return Common.Response(res, true, "Signin successfull!", {
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

module.exports = Signin;
