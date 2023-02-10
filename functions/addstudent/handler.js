const AddStudent = require("../../src/controllers/add-student");
module.exports = (req, res, _next) => {
  return AddStudent.handle(req, res);
};
