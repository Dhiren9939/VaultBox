class UserNotFoundError extends Error {
  constructor(message) {
    super(message);
  }
}

export default UserNotFoundError;
