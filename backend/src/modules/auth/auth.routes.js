import express from 'express';
import { handleLogin, handleRegister } from './auth.controller.js';
import {
  validateRegisterBody,
  validateLoginBody,
} from '#src/middleware/authValidation.js';
import handleValidationErrors from '../../middleware/handleValidationErrors.js';
import asyncHandler from '#src/utils/asyncHandler.js';

const authRouters = express.Router();

authRouters.post(
  '/api/auth/register',
  [validateRegisterBody, handleValidationErrors()],
  asyncHandler(handleRegister)
);

authRouters.post(
  '/api/auth/login',
  [validateLoginBody, handleValidationErrors()],
  asyncHandler(handleLogin)
);

export default authRouters;
