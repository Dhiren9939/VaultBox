import { registerUser, loginUser } from './auth.service.js';
import { SuccessResponse, ErrorResponse } from '#src/utils/response.js';
import UserExistsError from '#src/errors/userExistsError.js';
import InvalidCredentialsError from '#src/errors/invalidCredentialsError.js';

async function handleRegister(req, res) {
  const { firstName, lastName, email, password, eDEK } = req.body;

  try {
    const { userId, token } = await registerUser(
      firstName,
      lastName,
      email,
      password,
      eDEK
    );

    return SuccessResponse(
      res,
      { userId, token },
      'User registered successfully.',
      201
    );
  } catch (error) {
    if (error instanceof UserExistsError)
      return ErrorResponse(res, {}, error.message, 409);

    throw error;
  }
}

async function handleLogin(req, res) {
  const { email, password } = req.body;

  try {
    const { userId, token } = await loginUser(email, password);

    return SuccessResponse(
      res,
      { userId, token },
      'User logged in successfully.',
      200
    );
  } catch (err) {
    if (err instanceof InvalidCredentialsError)
      return ErrorResponse(res, {}, err.message, 401);

    throw err;
  }
}

export { handleRegister, handleLogin };
