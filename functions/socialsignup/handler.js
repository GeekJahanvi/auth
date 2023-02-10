const SocialSignup = require("../../src/controllers/social-signup");

module.exports = (req, res, _next) => {
  return SocialSignup.handle(req, res);
};
