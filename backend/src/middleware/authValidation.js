import { body } from "express-validator";
import zxcvbn from "zxcvbn";

const isStrong = (value, { req }) => {
    const { firstName, lastName, email } = req.body;
    const userInput = [firstName, lastName, email, "VaultBox"];

    if (zxcvbn(value, userInput).score != 4) return false;
    return true;
};

const passwordsMatch = (value, { req }) => {
    const { password } = req.body;
    if (password !== value) return false;
    return true;
};

export const validateRegisterBody = [
    body("firstName").trim().notEmpty().withMessage("First name is required."),
    body("lastName").trim().notEmpty().withMessage("Last name is required."),
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Invalid email format."),
    body("password")
        .trim()
        .notEmpty()
        .withMessage("Password is required.")
        .custom(isStrong)
        .withMessage("Password must be Strong."),
    body("confirmPassword")
        .trim()
        .notEmpty()
        .withMessage("Confirm password is required."),
    body("confirmPassword")
        .custom(passwordsMatch)
        .withMessage("Passwords must match."),
];

export const validateLoginBody = [
    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required.")
        .isEmail()
        .withMessage("Invalid email format."),
    body("password").trim().notEmpty().withMessage("Password is required."),
];
