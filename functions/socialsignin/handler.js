const SocialSignin = require("../../src/controllers/social-signin");
module.exports = (req, res, _next) => {
  return SocialSignin.handle(req, res);
};
