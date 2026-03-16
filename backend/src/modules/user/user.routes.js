import express from 'express';
import {
  handleDeleteUser,
  handleGetUser,
  handleUpdateUser,
} from '#src/modules/user/user.controller.js';
import { authenticateUser } from '#src/modules/auth/auth.middleware.js';
import handleValidationErrors from '#src/middleware/handleValidationErrors.js';
import asyncHandler from '#src/utils/asyncHandler.js';

const router = express.Router();

router.get('/api/users', authenticateUser, asyncHandler(handleGetUser));

router.put(
  '/api/users',
  authenticateUser,
  handleValidationErrors('Invalid User Update Request'),
  asyncHandler(handleUpdateUser)
);

router.delete('/api/users', authenticateUser, asyncHandler(handleDeleteUser));

export default router;
