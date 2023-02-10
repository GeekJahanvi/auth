function Queries() {
  this.USER_BY_EMAIL = `query ($email: String) {
    users(where: {email: {_eq: $email}}) {
      id
      name
      email
      password
      role
      created_at
      updated_at
      deleted_at
    }
  }`;

  this.TEACHER_STUDENT_BY_STUDENT_USER_ID = `query ($id: Int!) {
    teacher_students(where: {student: {user: {id: {_eq: $id}}}}) {
      id
      student_id
      teacher_id
      created_at
      updated_at
      deleted_at
    }
  }`;

  this.TEACHER_BY_USER_ID = `query ($id: Int!) {
    teachers(where: {user: {id: {_eq: $id}}}) {
      id
      user {
        id
        name
      }
    }
  }`;

  this.USER_ROLE_BY_KEY = `query ($key: String) {
    settings(where: {key: {_eq: $key}}) {
      id
      key
      value
    }
  }`;

  this.STUDENT_BY_STUDENT_USER_ID = `query ($id: Int!) {
    students(where: {user: {id: {_eq: $id}}}) {
      id
      created_at
      updated_at
    }
  }`;

  this.TEACHER_BY_TEACHER_USER_ID = `query ($id: Int!) {
    teachers(where: {user: {id: {_eq: $id}}}) {
      id
      created_at
      updated_at
    }
  }`;
}

module.exports = new Queries();
