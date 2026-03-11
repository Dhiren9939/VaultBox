import { Vault } from '#src/modules/vault/vault.model.js';
import User from '#src/modules/user/user.model.js';
import UserNotFoundError from '#src/errors/UserNotFoundError.js';

async function getVaultForUser(userId) {
  const user = await User.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError('No user found with this id.');

  const vault = await Vault.findOne({ _id: user.vaultId });
  if (!vault) throw new UserNotFoundError('No vault found for this user.');

  return vault;
}

async function createVault(eDEK, salt, iv) {
  return await Vault.create({
    eDEK,
    salt,
    iv,
  });
}

async function getVaultKey(userId) {
  const { eDEK, salt, iv } = await getVaultForUser(userId);

  return { eDEK, salt, iv };
}

async function createEntry(userId, cipherText, iv) {
  const vault = await getVaultForUser(userId);

  vault.entries.push({ cipherText, iv });
  await vault.save();

  return vault.entries[vault.entries.length - 1];
}

async function getEntries(userId, page, limit) {
  const vault = await getVaultForUser(userId);

  const totalEntries = vault.entries.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);
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
