import { body, query } from 'express-validator';

export const validateUserQuery = [
  query('email')
    .isEmail()
    .withMessage('A valid email address is required for lookup.')
    .trim()
    .toLowerCase(),
];

export const validateUserUpdate = [
  body('firstName')
    .optional()
    .isString()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long.')
    .trim(),
  body('lastName')
    .optional()
    .isString()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long.')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .trim()
    .toLowerCase(),
];
