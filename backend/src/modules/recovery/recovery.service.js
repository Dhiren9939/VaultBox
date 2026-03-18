import { Vault } from '#src/modules/vault/vault.model.js';
import { DeadDrop } from '#src/modules/dead-drops/dead-drop.model.js';

/**
 * WHO HAS MY SHARDS (Owner Perspective)
 * Finds all shards sent by this user, whether they are pending (in DeadDrops)
 * or accepted (in Vaults).
 */
async function getMyTrustees(ownerId) {
  // 1. Find pending shards in DeadDrops
  const deadDrops = await DeadDrop.find({ 'shards.senderId': ownerId })
    .populate('userId', 'firstName lastName email')
    .exec();

  const pendingRecipients = deadDrops.map((dd) => {
    const shard = dd.shards.find(
      (s) => s.senderId.toString() === ownerId.toString()
    );
    return {
      _id: shard._id,
      holder: dd.userId,
      status: 'pending',
      recoveryRequested: shard.recoveryRequested,
      createdAt: shard.createdAt,
    };
  });

  // 2. Find accepted shards in Vaults
  const vaults = await Vault.find({ 'shards.senderId': ownerId })
    .populate('userId', 'firstName lastName email')
    .exec();

  const acceptedRecipients = vaults.map((v) => {
    const shard = v.shards.find(
      (s) => s.senderId.toString() === ownerId.toString()
    );
    return {
      _id: shard._id,
      holder: v.userId,
      status: 'accepted',
      recoveryRequested: shard.recoveryRequested,
      createdAt: shard.createdAt,
    };
  });

  return [...pendingRecipients, ...acceptedRecipients];
}

/**
 * WHOSE SHARDS I HAVE (Trustee Perspective)
 * Finds accepted shards stored in the current user's Vault.
 */
async function getTrustors(holderId) {
  const vault = await Vault.findOne({ userId: holderId }).populate(
    'shards.senderId',
    'firstName lastName email'
  );
  if (!vault) return [];

  return vault.shards.map((s) => ({
    _id: s._id,
    owner: s.senderId,
    status: 'accepted',
    recoveryRequested: s.recoveryRequested,
    createdAt: s.createdAt,
  }));
}

/**
 * REVOKE TRUSTEE
 * Removes a shard sent by ownerId from a holder's Vault or DeadDrop.
 */
async function revokeTrustee(ownerId, shardId) {
  // Check DeadDrops
  const deadDrop = await DeadDrop.findOne({
    'shards._id': shardId,
    'shards.senderId': ownerId,
  });
  if (deadDrop) {
    deadDrop.shards.pull(shardId);
    await deadDrop.save();
    return { message: 'Pending shard revoked successfully.' };
  }

  // Check Vaults
  const vault = await Vault.findOne({
    'shards._id': shardId,
    'shards.senderId': ownerId,
  });
  if (vault) {
    vault.shards.pull(shardId);
    await vault.save();
    return { message: 'Accepted shard revoked successfully.' };
  }

  throw new Error('Shard not found or you are not the sender.');
}

/**
 * INITIATE RECOVERY
 * Marks all shards sent by this user as "recoveryRequested".
 */
async function initiateRecovery(ownerId) {
  // Update in DeadDrops
  await DeadDrop.updateMany(
    { 'shards.senderId': ownerId },
    { $set: { 'shards.$[elem].recoveryRequested': true } },
    { arrayFilters: [{ 'elem.senderId': ownerId }] }
  );

  // Update in Vaults
  await Vault.updateMany(
    { 'shards.senderId': ownerId },
    { $set: { 'shards.$[elem].recoveryRequested': true } },
    { arrayFilters: [{ 'elem.senderId': ownerId }] }
  );

  return { message: 'Recovery requested for all your trustees.' };
}

/**
 * GET INCOMING RECOVERY REQUESTS (Trustee Perspective)
 * Finds shards in the current user's Vault that have recoveryRequested: true.
 */
async function getIncomingRecoveryRequests(holderId) {
  const vault = await Vault.findOne({ userId: holderId }).populate(
    'shards.senderId',
    'firstName lastName email'
  );
  if (!vault) return [];

  return vault.shards
    .filter((s) => s.recoveryRequested)
    .map((s) => ({
      _id: s._id,
      owner: s.senderId,
      shardStr: s.shardStr,
    }));
}

export {
  getMyTrustees,
  getTrustors,
  revokeTrustee,
  initiateRecovery,
  getIncomingRecoveryRequests,
};
