import { Vault } from '#src/modules/vault/vault.model.js';
import { DeadDrop } from '#src/modules/dead-drops/dead-drop.model.js';
import User from '#src/modules/user/user.model.js';
import { RecoveryRequest } from '#src/modules/recovery/recovery.model.js';
import bcrypt from 'bcryptjs';
import RecoveryValidationError from '#src/errors/RecoveryValidationError.js';

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

async function getIncomingRecoveryRequests(holderId) {
  const vault = await Vault.findOne({ userId: holderId });
  if (!vault) return [];

  const requestedShards = vault.shards.filter((s) => s.recoveryRequested);

  const results = await Promise.all(
    requestedShards.map(async (s) => {
      // Find the active recovery session for the owner of this shard
      const activeRecovery = await RecoveryRequest.findOne({
        userId: s.senderId,
        isCompleted: false,
        expiresAt: { $gt: new Date() },
      }).populate('userId', 'firstName lastName email');

      if (!activeRecovery) return null;

      const hasContributed = activeRecovery.contributedShards.some(
        (contribution) =>
          contribution.contributorId.toString() === holderId.toString()
      );

      return {
        recoveryId: activeRecovery._id,
        owner: activeRecovery.userId,
        ephemeralPublicKey: activeRecovery.ephemeralPublicKey,
        shardStr: s.shardStr,
        shardIv: s.shardIv,
        hasContributed,
      };
    })
  );

  return results.filter((r) => r !== null);
}

async function startRecoverySession(
  email,
  intermediatePassword,
  ephemeralPublicKey,
  encryptedEphemeralPrivateKey,
  ephemeralIv,
  ephemeralSalt
) {
  const user = await User.findOne({ email });
  if (!user) throw new RecoveryValidationError('User not found.');
  if (!intermediatePassword) {
    throw new RecoveryValidationError('Intermediate password is required.');
  }

  const existingActiveSession = await RecoveryRequest.findOne({
    userId: user._id,
    isCompleted: false,
    expiresAt: { $gt: new Date() },
  });
  if (existingActiveSession) {
    if (!existingActiveSession.intermediatePasswordHash) {
      throw new Error(
        'Active recovery session is incompatible. Please wait for expiry and retry.'
      );
    }
    const matches = await bcrypt.compare(
      intermediatePassword,
      existingActiveSession.intermediatePasswordHash
    );
    if (!matches) {
      throw new Error(
        'An active recovery session already exists with a different intermediate password.'
      );
    }
    return {
      recoveryId: existingActiveSession._id,
      message:
        'An active recovery session already exists. Reusing the current session.',
    };
  }

  // Check if user has enough accepted shards (threshold 3)
  const acceptedTrusteesCount = await Vault.countDocuments({
    'shards.senderId': user._id,
  });
  if (acceptedTrusteesCount < 3) {
    throw new RecoveryValidationError(
      `Insufficient shards for recovery. Only ${acceptedTrusteesCount} accepted shards found (need at least 3).`
    );
  }

  const recoveryRequest = await RecoveryRequest.create({
    userId: user._id,
    intermediatePasswordHash: await bcrypt.hash(intermediatePassword, 12),
    ephemeralPublicKey,
    encryptedEphemeralPrivateKey,
    ephemeralIv,
    ephemeralSalt,
  });

  // Also flag the shards to notify trustees
  await initiateRecovery(user._id);

  return {
    recoveryId: recoveryRequest._id,
    message: 'Recovery session started. Your trustees have been notified.',
  };
}

async function contributeShardToRecovery(
  recoveryId,
  contributorId,
  encryptedShardStr
) {
  const recoverySession = await RecoveryRequest.findById(recoveryId);
  if (!recoverySession) {
    throw new RecoveryValidationError('Recovery session not found or expired.');
  }
  if (recoverySession.expiresAt <= new Date()) {
    throw new RecoveryValidationError('Recovery session has expired.');
  }

  const isAlreadyContributed = recoverySession.contributedShards.some(
    (s) => s.contributorId.toString() === contributorId.toString()
  );
  if (isAlreadyContributed) {
    throw new RecoveryValidationError(
      'You have already contributed a shard for this session.'
    );
  }

  // Contributor must actually hold a shard for the recovering user.
  const contributorVault = await Vault.findOne({ userId: contributorId });
  const validTrusteeShard = contributorVault?.shards?.some(
    (s) =>
      s.senderId.toString() === recoverySession.userId.toString() &&
      s.recoveryRequested
  );
  if (!validTrusteeShard) {
    throw new RecoveryValidationError(
      'You are not a valid trustee for this recovery request.'
    );
  }

  // Add the shard
  recoverySession.contributedShards.push({
    contributorId,
    encryptedShardStr,
  });

  await recoverySession.save();
  return { message: 'Thank you! Shard contributed successfully.' };
}

async function getRecoverySessionShards(recoveryId) {
  const recoverySession = await RecoveryRequest.findById(recoveryId)
    .populate('userId', 'fAttributes')
    .populate('contributedShards.contributorId', 'firstName lastName email');
  if (!recoverySession)
    throw new RecoveryValidationError('Recovery session not found.');
  if (recoverySession.expiresAt <= new Date()) {
    throw new RecoveryValidationError('Recovery session has expired.');
  }

  // Also fetch the vault metadata for this user
  const vault = await Vault.findOne({ userId: recoverySession.userId._id });

  return {
    ephemeralPublicKey: recoverySession.ephemeralPublicKey,
    encryptedEphemeralPrivateKey: recoverySession.encryptedEphemeralPrivateKey,
    ephemeralIv: recoverySession.ephemeralIv,
    ephemeralSalt: recoverySession.ephemeralSalt,
    fAttributes: recoverySession.userId?.fAttributes,
    // Vault metadata needed for reconstruction
    reDEK: vault?.reDEK,
    rIv: vault?.rIv,
    rSalt: vault?.rSalt,
    shards: recoverySession.contributedShards,
  };
}

async function finalizeRecovery(
  recoveryId,
  intermediatePassword,
  newPassword,
  newEDEK,
  newREDEK,
  kSalt,
  rSalt,
  kIv,
  rIv,
  publicKey,
  encryptedPrivateKey,
  rsaIv,
  fAttributes
) {
  const recoverySession = await RecoveryRequest.findById(recoveryId);
  if (!recoverySession)
    throw new RecoveryValidationError('Recovery session not found.');
  if (recoverySession.expiresAt <= new Date()) {
    throw new RecoveryValidationError('Recovery session has expired.');
  }
  if (!intermediatePassword) {
    throw new RecoveryValidationError('Intermediate password is required.');
  }
  if (!recoverySession.intermediatePasswordHash) {
    throw new RecoveryValidationError(
      'Recovery session is missing intermediate password hash. Restart recovery.'
    );
  }
  const isIntermediatePasswordValid = await bcrypt.compare(
    intermediatePassword,
    recoverySession.intermediatePasswordHash
  );
  if (!isIntermediatePasswordValid) {
    throw new RecoveryValidationError(
      'Invalid intermediate password for this recovery session.'
    );
  }
  if (!newPassword)
    throw new RecoveryValidationError('New password is required.');
  if (!newEDEK || !newREDEK || !kSalt || !rSalt || !kIv || !rIv) {
    throw new RecoveryValidationError(
      'Updated vault key material is required.'
    );
  }
  if (!publicKey || !encryptedPrivateKey || !rsaIv) {
    throw new RecoveryValidationError(
      'Updated user RSA key material is required.'
    );
  }
  if (!fAttributes?.a1 || !fAttributes?.a2) {
    throw new RecoveryValidationError('Recovery attributes are required.');
  }

  const contributorSet = new Set(
    recoverySession.contributedShards.map((s) => s.contributorId.toString())
  );
  if (contributorSet.size < 3) {
    throw new RecoveryValidationError(
      `Insufficient shards for recovery. Only ${contributorSet.size} unique shards found (need at least 3).`
    );
  }

  const user = await User.findById(recoverySession.userId);
  if (!user) throw new Error('User not found.');

  const vault = await Vault.findOne({ userId: user._id });
  if (!vault) throw new Error('Vault not found.');

  // 1) Commit login credential first so user can authenticate with new password
  // even if a later non-critical step fails.
  user.hashedPassword = await bcrypt.hash(newPassword, 12);
  await user.save();

  // 2) Rotate vault key material (full KEK + RKEK side)
  vault.eDEK = newEDEK;
  vault.reDEK = newREDEK;
  vault.kSalt = kSalt;
  vault.rSalt = rSalt;
  vault.kIv = kIv;
  vault.rIv = rIv;
  await vault.save();

  // 3) Rotate user crypto metadata
  user.publicKey = publicKey;
  user.encryptedPrivateKey = encryptedPrivateKey;
  user.rsaIv = rsaIv;
  user.fAttributes = fAttributes;
  await user.save();

  // Cleanup: remove all old distributed shards for this user because
  // full recovery rotates key material and invalidates previous shards.
  await DeadDrop.updateMany(
    { 'shards.senderId': user._id },
    { $pull: { shards: { senderId: user._id } } }
  );
  await Vault.updateMany(
    { 'shards.senderId': user._id },
    { $pull: { shards: { senderId: user._id } } }
  );

  // Cleanup: Delete the recovery session
  await RecoveryRequest.deleteOne({ _id: recoveryId });

  return {
    message:
      'Vault recovered successfully. You can now log in with your new password.',
  };
}

async function cancelRecoverySession(recoveryId, intermediatePassword) {
  const recoverySession = await RecoveryRequest.findById(recoveryId);
  if (!recoverySession)
    throw new RecoveryValidationError('Recovery session not found.');
  if (recoverySession.expiresAt <= new Date()) {
    throw new RecoveryValidationError('Recovery session has expired.');
  }
  if (!intermediatePassword) {
    throw new RecoveryValidationError('Intermediate password is required.');
  }
  if (!recoverySession.intermediatePasswordHash) {
    throw new RecoveryValidationError(
      'Recovery session is missing intermediate password hash. Cannot cancel safely.'
    );
  }

  const isIntermediatePasswordValid = await bcrypt.compare(
    intermediatePassword,
    recoverySession.intermediatePasswordHash
  );
  if (!isIntermediatePasswordValid) {
    throw new RecoveryValidationError(
      'Invalid intermediate password for this recovery session.'
    );
  }

  await DeadDrop.updateMany(
    { 'shards.senderId': recoverySession.userId },
    { $set: { 'shards.$[elem].recoveryRequested': false } },
    { arrayFilters: [{ 'elem.senderId': recoverySession.userId }] }
  );
  await Vault.updateMany(
    { 'shards.senderId': recoverySession.userId },
    { $set: { 'shards.$[elem].recoveryRequested': false } },
    { arrayFilters: [{ 'elem.senderId': recoverySession.userId }] }
  );

  await RecoveryRequest.deleteOne({ _id: recoveryId });

  return {
    message: 'Recovery session cancelled and shard request state reset.',
  };
}

export {
  getMyTrustees,
  getTrustors,
  revokeTrustee,
  initiateRecovery,
  getIncomingRecoveryRequests,
  startRecoverySession,
  contributeShardToRecovery,
  finalizeRecovery,
  getRecoverySessionShards,
  cancelRecoverySession,
};
