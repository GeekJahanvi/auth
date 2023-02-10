const bcryptjs = require("bcryptjs");
const Queries = require("../../graphql/queries");
const Mutations = require("../../graphql/mutations");
const Common = require("../../commons");
const Helpers = require("../../helpers");
const Locals = require("../../providers/locals");

async function resolveUser(email) {
  let userExists = false;
  let { data, error } = await Common.createAction(
    {
      email: email.toLowerCase(),
    },
    Queries.USER_BY_EMAIL,
    "users",
  );
  if (data.length) {
    userExists = true;
  }
  const user = data.length ? data[0] : null;
  return { userData: user, userErrors: error };
}

async function createUser(name, email, hashPswd, role) {
  const { data, error } = await Common.createAction(
    {
      name: name,
      email: email.toLowerCase(),
      profile_picture_url: "",
      password: hashPswd,
      role
    },
    Mutations.INSERT_USERS_ONE,
    "insert_users_one",
  );
  return { user: data, errors: error };
}

const AddAdmin = {
  async handle(req, res) {
    try {
      const { email, name } =
        req.body?.input?.input || req?.body?.input || req?.body;

      const { userData, userErrors } = await resolveUser(email);

      if (userErrors) {
        return res.status(200).json({ status: false, message: userErrors });
      }

      if (userData) {
        return res.status(200).json({
          status: false,
          message: `User is a ${userData.role} cannot add as admin`,
        });
      }

      const password = Common.passwordGenerator();
      const hashPswd = await bcryptjs.hash(password, 12);
      const role = await Common.fetchUserRole(process.env.USER_ROLE_ADMIN_KEY);
      const { user, errors } = await createUser(name, email, hashPswd, role);

      if (errors) {
        return res.status(200).json({ status: false, message: errors });
      }

      // sendEmail
      return res
        .status(200)
        .json({ status: false, message: `${user.email} is added as admin` });
    } catch (e) {
      return res
        .status(200)
        .json({ status: false, message: "Something went wrong." });
    }
  },
};

module.exports = AddAdmin;
