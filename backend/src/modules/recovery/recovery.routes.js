import express from 'express';
import {
  handleGetMyTrustees,
  handleGetMyTrustors,
  handleRevokeTrustee,
  handleGetIncomingRequests,
  handleInitiateRecovery,
  handleStartRecovery,
  handleContributeShard,
  handleGetRecoveryShards,
  handleFinalizeRecovery,
  handleCancelRecovery,
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
  '/api/recovery/requests',
  authenticateUser,
  asyncHandler(handleGetIncomingRequests)
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

router.post('/api/recovery/start', asyncHandler(handleStartRecovery));

router.post(
  '/api/recovery/approve/:recoveryId',
  authenticateUser,
  asyncHandler(handleContributeShard)
);

router.get(
  '/api/recovery/shards/:recoveryId',
  asyncHandler(handleGetRecoveryShards)
);

router.post('/api/recovery/complete', asyncHandler(handleFinalizeRecovery));

router.post('/api/recovery/cancel', asyncHandler(handleCancelRecovery));

export default router;
