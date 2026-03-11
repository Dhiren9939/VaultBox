import { ErrorResponse } from '#src/utils/response.js';
import { SuccessResponse } from '#src/utils/response.js';
import { createEntry, getEntries, getVaultKey } from './vault.service.js';
import UserNotFoundError from '#src/errors/UserNotFoundError.js';

async function handleCreateEntry(req, res) {
  try {
    const { cipherText, iv } = req.body;
    const userId = req.user?.id;

    if (!cipherText || !iv)
      return ErrorResponse(res, {}, 'cipherText and iv are required.', 400);

    const entry = await createEntry(userId, cipherText, iv);

    return SuccessResponse(res, entry, 'Entry Created Successfully', 201);
  } catch (error) {
    if (error instanceof UserNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

async function handleGetKey(req, res) {
  try {
    const userId = req.params.id;
    const vaultKey = await getVaultKey(userId);
    return SuccessResponse(
      res,
      vaultKey,
      'Vault Key Fetched Successfully',
      200
    );
  } catch (error) {
    if (error instanceof UserNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

async function handleGetEntries(req, res) {
  try {
    const userId = req.user?.id;
    const page = Number.parseInt(req.query.page, 10) || 1;
    const requestedLimit = Number.parseInt(req.query.limit, 10) || 10;
    const maxLimit = 20;
    const limit = Math.min(requestedLimit, maxLimit);

    if (page < 1 || limit < 1)
      return ErrorResponse(res, {}, 'page and limit must be >= 1.', 400);

    const data = await getEntries(userId, page, limit);

    return SuccessResponse(res, data, 'Entries Fetched Successfully', 200);
  } catch (error) {
    if (error instanceof UserNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

export { handleCreateEntry, handleGetKey, handleGetEntries };
