const Locals = require("./providers/locals");
const jwt = require("jsonwebtoken");
const Queries = require("./graphql/queries");

function Commons() {
  this.axios = require("axios");

  this.getTeacherStudent = async function(userId, userRole) {
    if(userRole === "teacher" || userRole === "super_admin") {
      return { teacherStudentId: 0, error: null };
    } else {
      let { data, error } = await this.createAction(
        {
          id: userId
        },
        Queries.TEACHER_STUDENT_BY_STUDENT_USER_ID,
        "teacher_students"
      );
      return { teacherStudentId: (data && data.length) ? data[0].id : null, error };
    }
  }

  this.fetchUserRole = async function(key) {
    const { data, error } = await this.createAction(
      {
        key
      },
      Queries.USER_ROLE_BY_KEY,
      "settings"
    );
    
    if(data && data.length) {
      return data[0].value;
    }
  }

  this.createAction = async function (input, mutationGql, mutationName) {
    try {
      const { data, errors } = await this.GQLRequest({
        variables: { ...input },
        query: mutationGql,
      });
      let error;

      if (!data || !data?.data || !data?.data[mutationName]) {
        error =
          errors ||
          data.errors[0].message ||
          `Something went wrong  in mutation ${mutationName}`;
      }

      const dataError = errors ? errors : error;
      const axiosData = dataError ? null : data?.data[mutationName];
      return {
        data: axiosData,
        error: dataError || null,
      };
    } catch (error) {
      return { data: null, error: error.message };
    }
  };

  /**
   * Graphql request
   */
  this.GQLRequest = async function ({ variables, query }) {
    const headers = {
      "content-type": "application/json",
      "x-hasura-admin-secret": Locals.config().hasuraAdminSecret,
    };

    return await this.axios({
      url: `${Locals.config().hasuraGraphqlURL}`,
      method: "POST",
      headers: headers,
      data: {
        query,
        variables,
      },
    });
  };

  /**
   * Server response
   */
  this.Response = function (res, status, message, data) {
    res.status(status ? 200 : 500).json({ status, message, data });
  };

  /**
   * check validation error
   */
  this.CheckError = async function (error, res, next) {
    if (error) {
      const { details } = error;
      const message = details.map((i) => i.message).join(",");

      return this.Response(res, false, message, null);
    }

    next();
  };

  this.passwordGenerator = (len) => {
    let length = len ? len : 10;
    let string = "abcdefghijklmnopqrstuvwxyz"; //to upper
    let numeric = "0123456789";
    let punctuation = "!@#$%&*";
    let password = "";
    let character = "";
    let crunch = true;
    while (password.length < length) {
      const entity1 = Math.ceil(string.length * Math.random() * Math.random());
      const entity2 = Math.ceil(numeric.length * Math.random() * Math.random());
      const entity3 = Math.ceil(
        punctuation.length * Math.random() * Math.random(),
      );
      let hold = string.charAt(entity1);
      hold = password.length % 2 == 0 ? hold.toUpperCase() : hold;
      character += hold;
      character += numeric.charAt(entity2);
      character += punctuation.charAt(entity3);
      password = character;
    }
    password = password
      .split("")
      .sort(function () {
        return 0.5 - Math.random();
      })
      .join("");
    return password.substr(0, len);
  };

  /**
   * validate token
   */
  this.decodeToken = (token) => {
    try {
      let decoded = jwt.verify(
        token.replace("Bearer ", ""),
        Locals.config().jwtSecret,
      );

      return decoded;
    } catch (err) {
      throw err;
    }
  };
}

module.exports = new Commons();
