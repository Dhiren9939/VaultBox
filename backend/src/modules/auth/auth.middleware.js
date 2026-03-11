import jwt from 'jsonwebtoken';
import { ErrorResponse } from '#src/utils/response.js';
import logger from '#src/utils/logger.js';
import env from '#src/config/env.js';

function authenticateUser(req, res, next) {
  try {
    const token = req.signedCookies.token;
    if (!token)
      return ErrorResponse(
        res,
        {},
        'Authentication token not found. Try logging in.',
        401
      );

    const decodedToken = jwt.verify(token, env.JWT_SECRET);
    logger.debug(decodedToken);
    req.user = decodedToken;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(error);
      return ErrorResponse(
        res,
        {},
        'Invalid authentication token. Try logging in.',
        401
      );
    }

    if (env.NODE_ENV !== 'production') logger.error(error.stack || error);
    else logger.error(error.message);

    return ErrorResponse(res, {}, 'Internal Server Error', 500);
  }
}

export { authenticateUser };
