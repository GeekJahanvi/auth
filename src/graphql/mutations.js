function Mutations() {
  this.INSERT_USERS_ONE = `mutation ($name: String, $email: String, $password: String, $profile_picture_url: String, $role: user_role_type) {
    insert_users_one(object: {name: $name, email: $email, password: $password, profile_picture_url:$profile_picture_url, role: $role}) {
      id
      email
      name
      profile_picture_url
      role
      created_at
      deleted_at
    }
  }`;

  this.UPDATE_USER_DELETED_AT = `
  mutation ($id: Int!) {
    update_users(where: {id: {_eq: $id}}, _set: {deleted_at: null}) {
      returning {
        id
        email
        name
        profile_picture_url
        role
        created_at
        updated_at
        deleted_at
      }
    }
  }
  `;

  this.INSERT_TEACHER_STUDENTS_ONE = `mutation($student_id: Int!, $teacher_id: Int!) {
    insert_teacher_students_one(object: {student_id: $student_id, teacher_id: $teacher_id}) {
      id
      created_at
      deleted_at
      added_in_spotlight
      is_active
      student_id
      teacher_id
      total_practice_duration
      updated_at
      description
    }
  }`;
}

module.exports = new Mutations();
