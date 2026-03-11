import { registerUser, loginUser } from './auth.service.js';
import { SuccessResponse, ErrorResponse } from '#src/utils/response.js';
import UserExistsError from '#src/errors/userExistsError.js';
import InvalidCredentialsError from '#src/errors/invalidCredentialsError.js';
import { setCookie } from '#src/utils/cookie.js';
import env from '#src/config/env.js';

async function handleRegister(req, res) {
  const { firstName, lastName, email, password, eDEK, iv, salt } = req.body;

  try {
    const { userId, token } = await registerUser(
      firstName,
      lastName,
      email,
      password,
      eDEK,
      iv,
      salt
    );

    setCookie(res, 'token', token, env.JWT_EXPIRES_IN_SEC * 1000);

    return SuccessResponse(
      res,
      { userId },
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

    setCookie(res, 'token', token, env.JWT_EXPIRES_IN_SEC * 1000);
    return SuccessResponse(
      res,
      { userId },
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
