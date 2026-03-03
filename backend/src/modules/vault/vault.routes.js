import { Router } from 'express';
import {
  createVaultEntry,
  getVaultKey,
  getVaultEntries,
} from './vault.controller.js';
import asyncHandler from '#src/utils/asyncHandler.js';
import authenticateUser from '#src/middleware/authenticateUser.js';

const router = Router();

router.post(
  '/api/user/:id/vault/entry',
  authenticateUser,
  asyncHandler(createVaultEntry)
);

router.get(
  '/api/user/:id/vault/entry',
  authenticateUser,
  asyncHandler(getVaultEntries)
);

router.get(
  '/api/user/:id/vault/key',
  authenticateUser,
  asyncHandler(getVaultKey)
);

export default router;
