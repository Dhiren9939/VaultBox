import ErrorResponse from '#src/utils/ErrorResponse.js';

function notFound(req, res) {
  return ErrorResponse(res, null, 'Resource not found.', 404);
}

export default notFound;
