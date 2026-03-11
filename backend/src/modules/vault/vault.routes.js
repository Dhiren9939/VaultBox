import express from 'express';
import {
  handleCreateEntry,
  handleGetKey,
  handleGetEntries,
} from '#src/modules/vault/vault.controller.js';
import {
  validateEntryBody,
  validateGetEntriesQuery,
} from '#src/modules/vault/vault.validation.js';
import asyncHandler from '#src/utils/asyncHandler.js';
import { authenticateUser } from '#src/modules/auth/auth.middleware.js';
import handleValidationErrors from '#src/middleware/handleValidationErrors.js';

const router = express.Router();

router.post(
  '/api/vaults/entries',
  [
    authenticateUser,
    validateEntryBody,
    handleValidationErrors('Invalid Vault Entry Request'),
  ],
  asyncHandler(handleCreateEntry)
);

router.get(
  '/api/vaults/entries',
  [
    authenticateUser,
    validateGetEntriesQuery,
    handleValidationErrors('Invalid Vault Entries Request'),
  ],
  asyncHandler(handleGetEntries)
);

router.get('/api/vaults/key', authenticateUser, asyncHandler(handleGetKey));

export default router;
