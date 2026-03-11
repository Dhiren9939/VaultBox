import env from '#src/config/env.js';

/**
 * Sets an HTTP-only, secure, signed cookie on the Express response.
 *
 * @param {import('express').Response} res - The Express response object.
 * @param {string} key - The name of the cookie.
 * @param {string} value - The value to store in the cookie.
 * @param {number} maxAge - The maximum age of the cookie in milliseconds.
 * @returns {void}
 */
function setCookie(res, key, value, maxAge) {
  res.cookie(key, value, {
    signed: true,
    maxAge,
    httpOnly: true,
    secure: true,
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'none',
  });
}

export { setCookie };
