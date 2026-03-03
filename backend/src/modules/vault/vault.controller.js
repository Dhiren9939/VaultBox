import { ErrorResponse } from '#src/utils/response.js';
import { SuccessResponse } from '#src/utils/response.js';
import { getVaultKey } from './vault.service.js';
import UserNotFoundError from '#src/errors/UserNotFoundError.js';

function handleCreateEntry(req, res) {
  return ErrorResponse(res, {}, 'Not Implemented', 501);
}

async function handleGetKey(req, res) {
  try {
    const { userId } = req.body;
    const vaultKey = await getVaultKey(userId);
    return SuccessResponse(
      res,
      vaultKey,
      'Vault Key Fetched Successfully',
      200
    );
  } catch (error) {
    if (error instanceof UserNotFoundError)
      return ErrorResponse(res, {}, 'User Not Found for the given userId', 404);
    throw error;
  }
}

function handleGetEntries(req, res) {
  return ErrorResponse(res, {}, 'Not Implemented', 501);
}

export { handleCreateEntry, handleGetKey, handleGetEntries };
