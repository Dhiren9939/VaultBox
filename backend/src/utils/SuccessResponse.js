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

export default SuccessResponse;
