class InvalidRefreshToken extends Error {
  constructor(message) {
    super(message);
  }
}

export default InvalidRefreshToken;
