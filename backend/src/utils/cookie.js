import env from '#src/config/env.js';

/**
 * Shared cookie options for auth cookies.
 */
const baseCookieOptions = {
  signed: true,
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
};

/**
 * Sets an HTTP-only, secure, signed cookie on the Express response.
 * @param {import('express').Response} res
 * @param {string} key
 * @param {string} value
 * @param {number} maxAge
 */
function setCookie(res, key, value, maxAge) {
  res.cookie(key, value, {
    ...baseCookieOptions,
    maxAge,
  });
}

/**
 * Clears an auth cookie.
 * @param {import('express').Response} res
 * @param {string} key
 */
function clearCookie(res, key) {
  res.clearCookie(key, baseCookieOptions);
}

export { setCookie, clearCookie };
