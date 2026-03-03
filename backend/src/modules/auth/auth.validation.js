import { body } from 'express-validator';
import zxcvbn from 'zxcvbn';

const isStrong = (value, { req }) => {
  const { firstName, lastName, email } = req.body;
  const userInput = [firstName, lastName, email, 'VaultBox'];

  if (zxcvbn(value, userInput).score !== 4) return false;
  return true;
};

const passwordsMatch = (value, { req }) => {
  const { password } = req.body;
  if (password !== value) return false;
  return true;
};

export const validateRegisterBody = [
  body('firstName').trim().notEmpty().withMessage('First name is required.'),
  body('lastName').trim().notEmpty().withMessage('Last name is required.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email format.'),
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required.')
    .custom(isStrong)
    .withMessage('Password must be Strong.'),
  body('eDEK')
    .trim()
    .notEmpty()
    .withMessage('eDEK is required.')
    .isLength({ min: 64, max: 64 }) // (32 + 16) -> 64
    .withMessage('eDEK must be 64 characters long.')
    .isBase64()
    .withMessage('Invalid eDEK format.'),
  body('salt')
    .trim()
    .notEmpty()
    .withMessage('Salt is required.')
    .isLength({ min: 44, max: 44 }) // 32 -> 44
    .withMessage('Salt must be 44 characters long.')
    .isBase64()
    .withMessage('Invalid salt format.'),
  body('iv')
    .trim()
    .notEmpty()
    .withMessage('IV is required.')
    .isLength({ min: 16, max: 16 }) // 12 -> 16
    .withMessage('IV must be 16 characters long.')
    .isBase64()
    .withMessage('Invalid IV format.'),
];

export const validateLoginBody = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email format.'),
  body('password').trim().notEmpty().withMessage('Password is required.'),
];
