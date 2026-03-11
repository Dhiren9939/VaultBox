import express from 'express';
import {
  handleCreateEntry,
  handleGetKey,
  handleGetEntries,
} from '#src/modules/vault/vault.controller.js';
import {
  validateCreateEntryBody,
  validateGetEntriesQuery,
  validateGetKeyParams,
} from '#src/modules/vault/vault.validation.js';
import asyncHandler from '#src/utils/asyncHandler.js';
import authenticateUser from '#src/middleware/authenticateUser.js';
import handleValidationErrors from '#src/middleware/handleValidationErrors.js';

const router = express.Router();

router.post(
  '/api/vault/entry',
  [
    authenticateUser,
    validateCreateEntryBody,
    handleValidationErrors('Invalid Vault Entry Request'),
  ],
  asyncHandler(handleCreateEntry)
);

router.get(
  '/api/vault/entry',
  [
    authenticateUser,
    validateGetEntriesQuery,
    handleValidationErrors('Invalid Vault Entries Request'),
  ],
  asyncHandler(handleGetEntries)
);

router.get(
  '/api/vault/:id/key',
  [
    authenticateUser,
    validateGetKeyParams,
    handleValidationErrors('Invalid Vault Key Request'),
  ],
  asyncHandler(handleGetKey)
);

export default router;
