import { ErrorResponse } from '#src/utils/response.js';

function createVaultEntry(req, res) {
  return ErrorResponse(res, {}, 'Not Implemented', 501);
}

function getVaultKey(req, res) {
  return ErrorResponse(res, {}, 'Not Implemented', 501);
}

function getVaultEntries(req, res) {
  return ErrorResponse(res, {}, 'Not Implemented', 501);
}

export { createVaultEntry, getVaultKey, getVaultEntries };
