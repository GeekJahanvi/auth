const bcryptjs = require("bcryptjs");
const Queries = require("../../graphql/queries");
const Mutations = require("../../graphql/mutations");
const Common = require("../../commons");
const Helpers = require("../../helpers");
const Locals = require("../../providers/locals");
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service:"Gmail",
    auth: {
    user:"jahanvi@geekyants.com",
    pass:"mvgmvmcjacabdwme",
    },
});

async function resolveUser(email) {
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
  return { user: user, userErrors: error };
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
  return { userData: data, errors: error };
}

async function updateUserDeletedAt(userId) {
  const { data, error } = await Common.createAction(
    {
      id: userId,
    },
    Mutations.UPDATE_USER_DELETED_AT,
    "update_users",
  );
  return { updatedUser: data, error: error };
}

async function resolveTeacherStudent(userId) {
  let { data, error } = await Common.createAction(
    {
      id: userId,
    },
    Queries.TEACHER_STUDENT_BY_STUDENT_USER_ID,
    "teacher_students",
  );
  const teacherStudentData = data.length ? data[0] : null;
  return { data: teacherStudentData, error: error };
}

async function getStudentId(studentUserId) {
  let { data, error } = await Common.createAction(
    {
      id: studentUserId,
    },
    Queries.STUDENT_BY_STUDENT_USER_ID,
    "students",
  );

  const id = data.length ? data[0].id : null;
  return id;
}

async function getTeacherId(teacherUserId) {
  let { data, error } = await Common.createAction(
    {
      id: teacherUserId,
    },
    Queries.TEACHER_BY_TEACHER_USER_ID,
    "teachers",
  );

  const id = data.length ? data[0].id : null;
  return id;
}

async function createTeacherStudent(studentUserId, teacherUserId) {
  const studentId = await getStudentId(studentUserId);
  const teacherId = await getTeacherId(teacherUserId);
  let teacherStudentData;
  if(studentId && teacherId) {
    let { data, error } = await Common.createAction(
      {
        student_id: studentId,
        teacher_id: teacherId
      },
      Mutations.INSERT_TEACHER_STUDENTS_ONE,
      "insert_teacher_students_one",
    );
    teacherStudentData = data.length ? data[0] : null;
    return { data: teacherStudentData, error: error };
  }
}

const AddStudent = {
  async handle(req, res) {
    const { email, name } =
      req.body?.input?.input || req?.body?.input || req?.body;

    let { user, userErrors } = await resolveUser(email);
    const userRoleStudent = await Common.fetchUserRole(process.env.USER_ROLE_STUDENT_KEY);
    const userRoleTeacher = await Common.fetchUserRole(process.env.USER_ROLE_TEACHER_KEY);
    if (userErrors) {
      return res.status(200).json({ status: false, message: userErrors });
    }

    if (user && user.deletedAt) {
      const { updatedUser, error } = await updateUserDeletedAt(user.id);
      if (error) {
        return res.status(200).json({ status: false, message: error });
      }
    }

    if (!user) {
      const password = Common.passwordGenerator();
      const hashPswd = await bcryptjs.hash(password, 12);
      const { userData, errors } = await createUser(name, email, hashPswd, userRoleStudent);
      user = userData;



      const from_email = 'jahanvi@geekyants.com';
      const mailOptions = {
      from: from_email, // sender address
      to: email, // list of receivers
      subject: 'Testing Hasura Actions', // Subject line
      html: '<p>'+'Hi, This is to test the email action handler</p>' // html body
  };
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
      	  console.log(error);
          return res.status(200).json({ status: false, message: error });
      }
      console.log('Message sent: ' + info.response);
      return res.status(200).json({ status: true, message: "mail sent" });
  });




    }

    let errorMessage;
    if (user.role == userRoleTeacher) {
      error = `Cannot add ${user.email} as a student as candidate has signed up as ${user.role}.`;
      return res.status(200).json({ status: false, message: error });
    } else if (user.role == userRoleStudent) {
      const { data, error } = await resolveTeacherStudent(user.id);
      if (error) {
        return res.status(200).json({ status: false, message: error });
      }
      if (data) {
        errorMessage = `Cannot add student. Student is enrolled by another teacher.`;
        return res.status(200).json({ status: false, message: errorMessage });
      }
    } else {
      errorMessage = `Cannot add this user as a student.`;
      return res.status(200).json({ status: false, message: errorMessage });
    }

    const decoded = Common.decodeToken(req.headers["authorization"]);
    const teacherUserId =
      decoded["https://hasura.io/jwt/claims"]["x-hasura-user-id"];

    // verify this once trigger is added.
    let {data, error} = await createTeacherStudent(user.id, teacherUserId);
    if(error) {
      errorMessage = `Error in assigning the student to your account.`;
      return res.status(200).json({ status: false, message: errorMessage });
    }
    //  sendEmail

    return res.status(200).json({
      status: true,
      message: `${user.email} has been added as a student.`,
    });
  },
};

module.exports = AddStudent;
