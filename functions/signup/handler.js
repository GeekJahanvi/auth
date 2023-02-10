const Signup = require("../../src/controllers/signup");
module.exports = (req, res, _next) => {
  return Signup.handle(req, res);
};
