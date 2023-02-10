const AddAdmin = require("../../src/controllers/add-admin");
module.exports = (req, res, _next) => {
  return AddAdmin.handle(req, res);
};
