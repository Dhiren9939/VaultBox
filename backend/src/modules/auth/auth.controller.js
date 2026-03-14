import { ErrorResponse, SuccessResponse } from '#src/utils/response.js';
import {
  loginUser,
  registerUser,
  refreshAccessToken,
  logUserOut,
} from './auth.service.js';
import UserExistsError from '#src/errors/UserExistsError.js';
import InvalidCredentialsError from '#src/errors/InvalidCredentialsError.js';
import env from '#src/config/env.js';
import { clearCookie, setCookie } from '#src/utils/cookie.js';
import InvalidRefreshToken from '#src/errors/InvalidRefreshToken.js';

/**
 * HTTP handler for user registration.
 *
 * @param {import('express').Request} req - The Express Request object containing the user's details.
 * @param {import('express').Response} res - The Express Response object.
 * @returns {Promise<void>}
 */
async function handleRegister(req, res) {
  const { firstName, lastName, email, password, eDEK, iv, salt } = req.body;
  try {
    const { user, accessToken, refreshToken } = await registerUser(
      firstName,
      lastName,
      email,
      password,
      eDEK,
      iv,
      salt
    );

    setCookie(
      res,
      'refreshToken',
      refreshToken,
      env.REFRESH_TOKEN_EXPIRES_IN_SEC * 1000
    );

    return SuccessResponse(
      res,
      { user, accessToken },
      'User registered successfully.',
      201
    );
  } catch (error) {
    if (error instanceof UserExistsError)
      return ErrorResponse(res, {}, error.message, 409);

    throw error;
  }
}

/**
 * HTTP handler for user login and token generation.
 *
 * @param {import('express').Request} req - The Express Request object containing user credentials.
 * @param {import('express').Response} res - The Express Response object.
 * @returns {Promise<void>}
 */
async function handleLogin(req, res) {
  const { email, password } = req.body;

  try {
    const { user, accessToken, refreshToken } = await loginUser(
      email,
      password
    );

    setCookie(
      res,
      'refreshToken',
      refreshToken,
      env.REFRESH_TOKEN_EXPIRES_IN_SEC * 1000
    );

    return SuccessResponse(
      res,
      { user, accessToken },
      'User logged in successfully.',
      200
    );
  } catch (err) {
    if (err instanceof InvalidCredentialsError)
      return ErrorResponse(res, {}, err.message, 401);

    throw err;
  }
}

/**
 * HTTP handler to refresh access token and rotate refresh token
 *
 * @param {import('express').Request} req - The Express Request object containing user credentials.
 * @param {import('express').Response} res - The Express Response object.
 * @returns {Promise<void>}
 */
async function handleRefresh(req, res) {
  const refreshToken = req.signedCookies.refreshToken;
  try {
    const {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    } = await refreshAccessToken(refreshToken);

    setCookie(
      res,
      'refreshToken',
      newRefreshToken,
      env.REFRESH_TOKEN_EXPIRES_IN_SEC * 1000
    );

    return SuccessResponse(
      res,
      { user, accessToken },
      'Token refreshed successfully.',
      200
    );
  } catch (err) {
    if (err instanceof InvalidRefreshToken)
      return ErrorResponse(res, {}, err.message, 401);
    throw err;
  }
}

/**
 * HTTP handler to log out a user.
 *
 * @param {import('express').Request} req - The Express Request object containing the authenticated user's ID.
 * @param {import('express').Response} res - The Express Response object.
 * @returns {Promise<void>}
 */
async function handleLogout(req, res) {
  const userId = req.user.id;
  await logUserOut(userId);
  clearCookie(res, 'refreshToken');
  return SuccessResponse(res, { userId }, 'Refresh token invalidated.', 200);
}

export { handleRegister, handleLogin, handleRefresh, handleLogout };
