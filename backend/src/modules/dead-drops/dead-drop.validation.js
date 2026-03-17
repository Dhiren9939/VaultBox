import { body } from 'express-validator';

export const addShardValidation = [
  body('shardStr')
    .isString()
    .notEmpty()
    .withMessage('shardStr is required and must be a string.'),
];
