import process from 'process';
import logger from '#src/utils/logger.js';
import { ErrorResponse } from '#src/utils/response.js';

function centralErrorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'production') logger.error(err.stack || err);
  else logger.error(err.message || 'Unhandled Request');
  return ErrorResponse(res, {}, 'Internal Server Error', 500);
}

export default centralErrorHandler;
