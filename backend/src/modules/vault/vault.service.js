// Vault data access helpers for vault keys and entries.
import { Vault } from '#src/modules/vault/vault.model.js';
import VaultNotFoundError from '#src/errors/VaultNotFoundError.js';

async function createVault(userId, eDEK, reDEK, kSalt, rSalt, kIv, rIv) {
  return await Vault.create({
    userId,
    eDEK,
    reDEK,
    kSalt,
    rSalt,
    kIv,
    rIv,
  });
}

async function getVaultKey(vaultId) {
  const vault = await Vault.findById(vaultId);
  if (!vault) throw new VaultNotFoundError('No vault with given vaultId.');

  const { eDEK, reDEK, kSalt, rSalt, kIv, rIv } = vault;
  return { eDEK, reDEK, kSalt, rSalt, kIv, rIv };
}

/**
 * Adds a new encrypted entry to a vault.
 */
async function createEntry(vaultId, cipherText, eIv) {
  const vault = await Vault.findById(vaultId);
  if (!vault) throw new VaultNotFoundError('No vault with given vaultId.');

  vault.entries.push({ cipherText, eIv });
  await vault.save();

  return vault.entries[vault.entries.length - 1];
}

/**
 * Returns paginated encrypted entries for a vault.
 */
async function getEntries(vaultId, page, limit) {
  const vault = await Vault.findById(vaultId);
  if (!vault) throw new VaultNotFoundError('No vault with given vaultId.');

  const totalEntries = vault.entries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / limit));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * limit;

  const entries = vault.entries.slice(skip, skip + limit);

  return {
    entries,
    page: safePage,
    limit,
    totalEntries,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
}

export {
  createVault,
  getVaultKey,
  createEntry,
  getEntries,
  updateEntry,
  deleteEntry,
  addShardToVault,
};

async function addShardToVault(vaultId, senderId, shardStr, shardIv) {
  const vault = await Vault.findById(vaultId);
  if (!vault) throw new VaultNotFoundError('No vault with given vaultId.');

  vault.shards.push({ senderId, shardStr, shardIv });
  await vault.save();

  return vault.shards[vault.shards.length - 1];
}

async function updateEntry(vaultId, entryId, cipherText, eIv) {
  const vault = await Vault.findById(vaultId);
  if (!vault) throw new VaultNotFoundError('No vault with given vaultId.');

  const entry = vault.entries.id(entryId);
  if (!entry) throw new VaultNotFoundError('No entry with given entryId.');

  entry.cipherText = cipherText;
  entry.eIv = eIv;
  await vault.save();

  return entry;
}

async function deleteEntry(vaultId, entryId) {
  const vault = await Vault.findById(vaultId);
  if (!vault) throw new VaultNotFoundError('No vault with given vaultId.');

  const entry = vault.entries.id(entryId);
  if (!entry) throw new VaultNotFoundError('No entry with given entryId.');

  entry.deleteOne();
  await vault.save();
}
