import {
  getIncomingRecoveryRequests,
  getMyTrustees,
  getTrustors,
  revokeTrustee,
  initiateRecovery,
} from '#src/modules/recovery/recovery.service.js';
import { SuccessResponse } from '#src/utils/response.js';

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

export {
  handleGetMyTrustees,
  handleGetMyTrustors,
  handleRevokeTrustee,
  handleInitiateRecovery,
  handleGetIncomingRequests,
};
