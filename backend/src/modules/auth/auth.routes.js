import express from 'express';
import {
  handleLogin,
  handleRegister,
  handleRefresh,
  handleLogout,
} from '#src/modules/auth/auth.controller.js';
import {
  validateRegisterBody,
  validateLoginBody,
} from '#src/modules/auth/auth.validation.js';
import handleValidationErrors from '#src/middleware/handleValidationErrors.js';
import asyncHandler from '#src/utils/asyncHandler.js';
import { authenticateUser } from '#src/modules/auth/auth.middleware.js';
import { SuccessResponse } from '#src/utils/response.js';

const router = express.Router();

router.post(
  '/api/auth/register',
  [...validateRegisterBody, handleValidationErrors('Invalid Register Request')],
  asyncHandler(handleRegister)
);

router.post(
  '/api/auth/login',
  [...validateLoginBody, handleValidationErrors('Invalid Login Request')],
  asyncHandler(handleLogin)
);

router.get('/api/auth/refresh', asyncHandler(handleRefresh));

router.get('/api/auth/test', authenticateUser, (req, res) => {
  return SuccessResponse(res, {}, 'Valid Access Token', 200);
});

router.post('/api/auth/logout', authenticateUser, asyncHandler(handleLogout));

export default router;
