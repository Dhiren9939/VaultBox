import { Vault } from '#src/modules/vault/vault.model.js';
import VaultNotFoundError from '#src/errors/VaultNotFoundError.js';

async function createVault(userId, eDEK, salt, iv) {
  return await Vault.create({
    userId,
    eDEK,
    salt,
    iv,
  });
}

async function getVaultKey(vaultId) {
  const vault = await Vault.findById(vaultId);
  if (!vault) throw new VaultNotFoundError('No vault with given vaultId.');

  const { eDEK, salt, iv } = vault;
  return { eDEK, salt, iv };
}

async function createEntry(vaultId, cipherText, iv) {
  const vault = await Vault.findById(vaultId);
  if (!vault) throw new VaultNotFoundError('No vault with given vaultId.');

  vault.entries.push({ cipherText, iv });
  await vault.save();
}

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

export { createVault, getVaultKey, createEntry, getEntries };
