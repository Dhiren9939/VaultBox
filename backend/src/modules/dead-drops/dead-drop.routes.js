import express from 'express';
import { authenticateUser } from '#src/modules/auth/auth.middleware.js';
import handleValidationErrors from '#src/middleware/handleValidationErrors.js';
import asyncHandler from '#src/utils/asyncHandler.js';
import {
  handleGetDeadDrop,
  handleAddShardToDeadDrop,
  handleRemoveShardFromDeadDrop,
} from './dead-drop.controller.js';
import { addShardValidation } from './dead-drop.validation.js';

const router = express.Router();

router.get(
  '/api/dead-drops',
  authenticateUser,
  asyncHandler(handleGetDeadDrop)
);

router.post(
  '/api/dead-drops/:id',
  authenticateUser,
  addShardValidation,
  handleValidationErrors('Invalid Shard Payload'),
  asyncHandler(handleAddShardToDeadDrop)
);

router.delete(
  '/api/dead-drops/shards/:shardId',
  authenticateUser,
  asyncHandler(handleRemoveShardFromDeadDrop)
);

export default router;
