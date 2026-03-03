import { Router } from 'express';
import {
  handleCreateEntry,
  handleGetKey,
  handleGetEntries,
} from './vault.controller.js';
import asyncHandler from '#src/utils/asyncHandler.js';
import authenticateUser from '#src/middleware/authenticateUser.js';

const router = Router();

router.post(
  '/api/vault/entry',
  authenticateUser,
  asyncHandler(handleCreateEntry)
);

router.get(
  '/api/vault/entry',
  authenticateUser,
  asyncHandler(handleGetEntries)
);

router.get('/api/vault/key', authenticateUser, asyncHandler(handleGetKey));

export default router;
