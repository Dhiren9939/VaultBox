const ErrorResponse = (
  res,
  details = {},
  message = 'Error',
  statusCode = 500
) => {
  const response = { statusCode, message };
  if (details) response.details = details;

  return res.status(statusCode).json(response);
};

const SuccessResponse = (
  res,
  details = {},
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    statusCode,
    message,
    details,
  });
};

export { SuccessResponse, ErrorResponse };
