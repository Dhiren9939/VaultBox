import { validationResult } from "express-validator";

export default function handleValidationErrors(errorMsg = "Invalid Request") {
  return (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map((err) => {
        return { field: err.path, message: err.msg };
      });

      return res.status(400).send({
        message: errorMsg,
        details: formattedErrors,
      });
    }

    next();
  };
}
