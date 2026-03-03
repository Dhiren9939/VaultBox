class InvalidCredentialsError extends Error {
  constructor(message) {
    super(message);
  }
}

export default InvalidCredentialsError;
