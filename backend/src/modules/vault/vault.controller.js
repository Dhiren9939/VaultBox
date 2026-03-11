import { ErrorResponse } from '#src/utils/response.js';
import { SuccessResponse } from '#src/utils/response.js';
import { createEntry, getEntries, getVaultKey } from './vault.service.js';
import VaultNotFoundError from '#src/errors/VaultNotFoundError.js';

async function handleCreateEntry(req, res) {
  try {
    const { cipherText, iv } = req.body;
    const vaultId = req.user.vaultId;

    await createEntry(vaultId, cipherText, iv);

    return SuccessResponse(res, {}, 'Entry Created Successfully', 201);
  } catch (error) {
    if (error instanceof VaultNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

async function handleGetKey(req, res) {
  try {
    const { vaultId } = req.user;
    const vaultKey = await getVaultKey(vaultId);
    return SuccessResponse(
      res,
      vaultKey,
      'Vault Key Fetched Successfully',
      200
    );
  } catch (error) {
    if (error instanceof VaultNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

async function handleGetEntries(req, res) {
  try {
    const { vaultId } = req.user;
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const data = await getEntries(vaultId, page, limit);

    return SuccessResponse(res, data, 'Entries Fetched Successfully', 200);
  } catch (error) {
    if (error instanceof VaultNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

export { handleCreateEntry, handleGetKey, handleGetEntries };
