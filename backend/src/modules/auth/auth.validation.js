import { body } from 'express-validator';
import zxcvbn from 'zxcvbn';

const isStrong = (value, { req }) => {
  const { firstName, lastName, email } = req.body;
  const userInput = [firstName, lastName, email, 'VaultBox'];

  if (zxcvbn(value, userInput).score !== 4) return false;
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
    .withMessage('Invalid email format.')
    .normalizeEmail(),
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
  body('reDEK')
    .trim()
    .notEmpty()
    .withMessage('reDEK is required.')
    .isLength({ min: 64, max: 64 }) // (32 + 16) -> 64
    .withMessage('reDEK must be 64 characters long.')
    .isBase64()
    .withMessage('Invalid reDEK format.'),
  body('kSalt')
    .trim()
    .notEmpty()
    .withMessage('kSalt is required.')
    .isLength({ min: 44, max: 44 }) // 32 -> 44
    .withMessage('kSalt must be 44 characters long.')
    .isBase64()
    .withMessage('Invalid kSalt format.'),
  body('rSalt')
    .trim()
    .notEmpty()
    .withMessage('rSalt is required.')
    .isLength({ min: 44, max: 44 }) // 32 -> 44
    .withMessage('rSalt must be 44 characters long.')
    .isBase64()
    .withMessage('Invalid rSalt format.'),
  body('kIv')
    .trim()
    .notEmpty()
    .withMessage('kIv is required.')
    .isLength({ min: 16, max: 16 }) // 12 -> 16
    .withMessage('kIv must be 16 characters long.')
    .isBase64()
    .withMessage('Invalid kIv format.'),
  body('rIv')
    .trim()
    .notEmpty()
    .withMessage('rIv is required.')
    .isLength({ min: 16, max: 16 }) // 12 -> 16
    .withMessage('rIv must be 16 characters long.')
    .isBase64()
    .withMessage('Invalid rIv format.'),
];

export const validateLoginBody = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email format.')
    .normalizeEmail(),
  body('password').trim().notEmpty().withMessage('Password is required.'),
];
