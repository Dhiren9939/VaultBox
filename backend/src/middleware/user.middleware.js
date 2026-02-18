import { body } from "express-validator";

export const validateRegisterBody = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").trim().notEmpty().withMessage("Last name is required"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  body("password").trim().notEmpty().withMessage("Password is required"),
  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),
];
