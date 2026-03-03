class UserExistsError extends Error {
  constructor(message) {
    super(message);
  }
}

export default UserExistsError;
