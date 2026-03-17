import { DeadDrop } from './dead-drop.model.js';

export async function getDeadDropByUserId(userId) {
  const deadDrop = await DeadDrop.findOne({ userId });
  return deadDrop ? deadDrop.shards : [];
}

export async function addShardToDeadDrop(deadDropId, senderId, shardStr) {
  const deadDrop = await DeadDrop.findById(deadDropId);
  if (!deadDrop) {
    throw new Error('Dead Drop not found');
  }

  const shard = { senderId, shardStr };
  deadDrop.shards.push(shard);
  await deadDrop.save();
  return deadDrop.shards[deadDrop.shards.length - 1]; // Return the pushed shard
}
