const Signin = require("../../src/controllers/signin");
module.exports = (req, res, _next) => {
  return Signin.handle(req, res);
};
