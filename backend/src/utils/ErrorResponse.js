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

export default ErrorResponse;
