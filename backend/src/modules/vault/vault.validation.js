import { body, param, query } from 'express-validator';

export const validateEntryBody = [
  body('cipherText')
    .trim()
    .notEmpty()
    .withMessage('cipherText is required.')
    .isBase64()
    .withMessage('cipherText must be base64.'),
  body('iv')
    .trim()
    .notEmpty()
    .withMessage('iv is required.')
    .isLength({ min: 16, max: 16 })
    .withMessage('iv must be 16 characters long.')
    .isBase64()
    .withMessage('iv must be base64.'),
];

export const validateGetEntriesQuery = [
  query('page').isInt({ min: 1 }).withMessage('page must be an integer >= 1.'),
  query('limit')
    .isInt({ min: 1, max: 20 })
    .withMessage('limit must be an integer between 1 and 20.'),
];

export const validateEntryIdParam = [
  param('entryId')
    .notEmpty()
    .withMessage('entryId is required.')
    .isMongoId()
    .withMessage('entryId must be a valid Mongo id.'),
];
