import {
  getIncomingRecoveryRequests,
  getMyTrustees,
  getTrustors,
  revokeTrustee,
  initiateRecovery,
  startRecoverySession,
  contributeShardToRecovery,
  getRecoverySessionShards,
  finalizeRecovery,
  cancelRecoverySession,
} from '#src/modules/recovery/recovery.service.js';
import { ErrorResponse, SuccessResponse } from '#src/utils/response.js';
import RecoveryValidationError from '#src/errors/RecoveryValidationError.js';

function handleRecoveryValidationError(res, error) {
  if (error instanceof RecoveryValidationError) {
    return ErrorResponse(res, {}, error.message, error.statusCode || 400);
  }
  throw error;
}

async function handleGetMyTrustees(req, res) {
  const trustees = await getMyTrustees(req.user.id);
  SuccessResponse(res, trustees, 'My trustees list fetched successfully.');
}

async function handleGetMyTrustors(req, res) {
  const trustors = await getTrustors(req.user.id);
  SuccessResponse(res, trustors, 'My trustors list fetched successfully.');
}

async function handleRevokeTrustee(req, res) {
  const { shardId } = req.params;
  const result = await revokeTrustee(req.user.id, shardId);
  SuccessResponse(res, result, result.message);
}

async function handleInitiateRecovery(req, res) {
  const result = await initiateRecovery(req.user.id);
  SuccessResponse(res, result, result.message);
}

async function handleGetIncomingRequests(req, res) {
  const requests = await getIncomingRecoveryRequests(req.user.id);
  SuccessResponse(res, requests, 'Incoming recovery requests fetched.');
}

async function handleStartRecovery(req, res) {
  const {
    email,
    intermediatePassword,
    ephemeralPublicKey,
    encryptedEphemeralPrivateKey,
    ephemeralIv,
    ephemeralSalt,
  } = req.body;
  try {
    const result = await startRecoverySession(
      email,
      intermediatePassword,
      ephemeralPublicKey,
      encryptedEphemeralPrivateKey,
      ephemeralIv,
      ephemeralSalt
    );
    SuccessResponse(res, result, result.message);
  } catch (error) {
    handleRecoveryValidationError(res, error);
  }
}

async function handleContributeShard(req, res) {
  const { recoveryId } = req.params;
  const { encryptedShardStr } = req.body;
  try {
    const result = await contributeShardToRecovery(
      recoveryId,
      req.user.id,
      encryptedShardStr
    );
    SuccessResponse(res, result, result.message);
  } catch (error) {
    handleRecoveryValidationError(res, error);
  }
}

async function handleGetRecoveryShards(req, res) {
  const { recoveryId } = req.params;
  try {
    const data = await getRecoverySessionShards(recoveryId);
    SuccessResponse(res, data, 'Recovery metadata and shards fetched.');
  } catch (error) {
    handleRecoveryValidationError(res, error);
  }
}

async function handleFinalizeRecovery(req, res) {
  const {
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
    fAttributes,
  } = req.body;
  try {
    const result = await finalizeRecovery(
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
    );
    SuccessResponse(res, result, result.message);
  } catch (error) {
    handleRecoveryValidationError(res, error);
  }
}

async function handleCancelRecovery(req, res) {
  const { recoveryId, intermediatePassword } = req.body;
  try {
    const result = await cancelRecoverySession(
      recoveryId,
      intermediatePassword
    );
    SuccessResponse(res, result, result.message);
  } catch (error) {
    handleRecoveryValidationError(res, error);
  }
}

export {
  handleGetMyTrustees,
  handleGetMyTrustors,
  handleRevokeTrustee,
  handleInitiateRecovery,
  handleGetIncomingRequests,
  handleStartRecovery,
  handleContributeShard,
  handleGetRecoveryShards,
  handleFinalizeRecovery,
  handleCancelRecovery,
};
