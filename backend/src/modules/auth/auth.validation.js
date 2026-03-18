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
    .trim()
    .toLowerCase(),
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
  body('fAttributes').isObject().withMessage('fAttributes is required.'),
  body('fAttributes.a1')
    .isString()
    .notEmpty()
    .isLength({ min: 24, max: 24 })
    .withMessage('a1 is required.'),
  body('fAttributes.a2')
    .isString()
    .notEmpty()
    .isLength({ min: 24, max: 24 })
    .withMessage('a2 is required.'),
  body('publicKey')
    .trim()
    .notEmpty()
    .withMessage('publicKey is required.')
    .isLength({ min: 392, max: 392 })
    .withMessage('publicKey must be 392 characters long.')
    .isBase64()
    .withMessage('Invalid publicKey format.'),
  body('encryptedPrivateKey')
    .trim()
    .notEmpty()
    .withMessage('encryptedPrivateKey is required.')
    .isLength({ min: 1600, max: 1700 })
    .withMessage(
      'encryptedPrivateKey must be between 1600 and 1700 characters long.'
    )
    .isBase64()
    .withMessage('Invalid encryptedPrivateKey format.'),
  body('rsaIv')
    .trim()
    .notEmpty()
    .withMessage('rsaIv is required.')
    .isLength({ min: 16, max: 16 })
    .withMessage('rsaIv must be 16 characters long.')
    .isBase64()
    .withMessage('Invalid rsaIv format.'),
];

export const validateLoginBody = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Invalid email format.')
    .trim()
    .toLowerCase(),
  body('password').trim().notEmpty().withMessage('Password is required.'),
];
