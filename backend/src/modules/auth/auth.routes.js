import express from 'express';
import {
  handleLogin,
  handleRegister,
} from '#src/modules/auth/auth.controller.js';
import {
  validateRegisterBody,
  validateLoginBody,
} from '#src/modules/auth/auth.validation.js';
import handleValidationErrors from '#src/middleware/handleValidationErrors.js';
import asyncHandler from '#src/utils/asyncHandler.js';

const authRouters = express.Router();

authRouters.post(
  '/api/auth/register',
  [validateRegisterBody, handleValidationErrors('Invalid Register Request')],
  asyncHandler(handleRegister)
);

authRouters.post(
  '/api/auth/login',
  [validateLoginBody, handleValidationErrors('Invalid Login Request')],
  asyncHandler(handleLogin)
);

export default authRouters;
