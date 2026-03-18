import { ErrorResponse, SuccessResponse } from '#src/utils/response.js';
import {
  getDeadDropByUserId,
  addShardToDeadDrop,
  removeShardFromDeadDrop,
} from './dead-drop.service.js';

export async function handleGetDeadDrop(req, res) {
  try {
    const userId = req.user.id;
    const shards = await getDeadDropByUserId(userId);
    return SuccessResponse(res, { shards }, 'Shards fetched successfully', 200);
  } catch (error) {
    return ErrorResponse(res, {}, error.message, 500);
  }
}

export async function handleAddShardToDeadDrop(req, res) {
  try {
    const deadDropId = req.params.id;
    const senderId = req.user.id;
    const { shardStr } = req.body;

    const shard = await addShardToDeadDrop(deadDropId, senderId, shardStr);
    return SuccessResponse(res, { shard }, 'Shard added successfully', 201);
  } catch (error) {
    return ErrorResponse(res, {}, error.message, 400);
  }
}

export async function handleRemoveShardFromDeadDrop(req, res) {
  try {
    const userId = req.user.id;
    const { shardId } = req.params;
    await removeShardFromDeadDrop(userId, shardId);
    return SuccessResponse(res, {}, 'Shard removed successfully', 200);
  } catch (error) {
    return ErrorResponse(res, {}, error.message, 400);
  }
}
