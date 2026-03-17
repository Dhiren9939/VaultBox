import { ErrorResponse, SuccessResponse } from '#src/utils/response.js';
import {
  getDeadDropByUserId,
  addShardToDeadDrop,
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
    return ErrorResponse(res, {}, error.message, 400); // Or 404 for not found
  }
}
