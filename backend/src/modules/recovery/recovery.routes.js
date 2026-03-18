import express from 'express';
import {
  handleGetMyTrustees,
  handleGetMyTrustors,
  handleRevokeTrustee,
  handleGetIncomingRequests,
  handleInitiateRecovery,
} from '#src/modules/recovery/recovery.controller.js';
import { authenticateUser } from '#src/modules/auth/auth.middleware.js';
import asyncHandler from '#src/utils/asyncHandler.js';

const router = express.Router();

router.get(
  '/api/recovery/trustees',
  authenticateUser,
  asyncHandler(handleGetMyTrustees)
);

router.get(
  '/api/recovery/trustors',
  authenticateUser,
  asyncHandler(handleGetMyTrustors)
);

router.delete(
  '/api/recovery/shards/:shardId',
  authenticateUser,
  asyncHandler(handleRevokeTrustee)
);

router.post(
  '/api/recovery/initiate',
  authenticateUser,
  asyncHandler(handleInitiateRecovery)
);

router.get(
  '/api/recovery/requests',
  authenticateUser,
  asyncHandler(handleGetIncomingRequests)
);

export default router;
