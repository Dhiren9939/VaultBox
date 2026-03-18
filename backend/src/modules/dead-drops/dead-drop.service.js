import { Vault } from '#src/modules/vault/vault.model.js';
import { DeadDrop } from './dead-drop.model.js';

export async function getDeadDropByUserId(userId) {
  const deadDrop = await DeadDrop.findOne({ userId }).populate(
    'shards.senderId',
    'firstName lastName email'
  );
  return deadDrop ? deadDrop.shards : [];
}

export async function addShardToDeadDrop(deadDropId, senderId, shardStr) {
  const deadDrop = await DeadDrop.findById(deadDropId);
  if (!deadDrop) {
    throw new Error('Dead Drop not found');
  }

  // 1. Cannot send to self
  if (deadDrop.userId.toString() === senderId.toString()) {
    throw new Error('You cannot send a recovery shard to yourself.');
  }

  // 2. Check if already in pending shards (DeadDrop)
  const existingPending = deadDrop.shards.find(
    (s) => s.senderId.toString() === senderId.toString()
  );
  if (existingPending) {
    throw new Error('This user already has a pending shard from you.');
  }

  // 3. Check if recipient already has an accepted shard from this sender in their Vault
  const recipientVault = await Vault.findOne({ userId: deadDrop.userId });
  if (recipientVault) {
    const existingAccepted = recipientVault.shards.find(
      (s) => s.senderId.toString() === senderId.toString()
    );
    if (existingAccepted) {
      throw new Error('This user has already accepted a shard from you.');
    }
  }

  const shard = { senderId, shardStr };
  deadDrop.shards.push(shard);
  await deadDrop.save();
  return deadDrop.shards[deadDrop.shards.length - 1]; // Return the pushed shard
}

export async function removeShardFromDeadDrop(userId, shardId) {
  const deadDrop = await DeadDrop.findOne({ userId });
  if (!deadDrop) {
    throw new Error('Dead Drop not found');
  }

  const shard = deadDrop.shards.id(shardId);
  if (!shard) {
    throw new Error('Shard not found');
  }

  shard.deleteOne();
  await deadDrop.save();
}
