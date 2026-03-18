// Vault route handlers for encrypted entries and vault keys.
import { ErrorResponse } from '#src/utils/response.js';
import { SuccessResponse } from '#src/utils/response.js';
import {
  createEntry,
  deleteEntry,
  getEntries,
  getVaultKey,
  updateEntry,
  addShardToVault,
} from './vault.service.js';
import VaultNotFoundError from '#src/errors/VaultNotFoundError.js';

async function handleCreateEntry(req, res) {
  try {
    const { cipherText, eIv } = req.body;
    const vaultId = req.user.vaultId;

    const entry = await createEntry(vaultId, cipherText, eIv);

    return SuccessResponse(res, { entry }, 'Entry Created Successfully', 201);
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

async function handleUpdateEntry(req, res) {
  try {
    const { cipherText, eIv } = req.body;
    const { entryId } = req.params;
    const vaultId = req.user.vaultId;

    const entry = await updateEntry(vaultId, entryId, cipherText, eIv);

    return SuccessResponse(res, { entry }, 'Entry Updated Successfully', 200);
  } catch (error) {
    if (error instanceof VaultNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

async function handleDeleteEntry(req, res) {
  try {
    const { entryId } = req.params;
    const vaultId = req.user.vaultId;

    await deleteEntry(vaultId, entryId);

    return SuccessResponse(res, {}, 'Entry Deleted Successfully', 200);
  } catch (error) {
    if (error instanceof VaultNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

async function handleAddShard(req, res) {
  try {
    const { senderId, shardStr, shardIv } = req.body;
    const vaultId = req.user.vaultId;

    const shard = await addShardToVault(vaultId, senderId, shardStr, shardIv);

    return SuccessResponse(res, { shard }, 'Shard added to vault.', 201);
  } catch (error) {
    if (error instanceof VaultNotFoundError)
      return ErrorResponse(res, {}, error.message, 404);
    throw error;
  }
}

export {
  handleCreateEntry,
  handleGetKey,
  handleGetEntries,
  handleUpdateEntry,
  handleDeleteEntry,
  handleAddShard,
};
