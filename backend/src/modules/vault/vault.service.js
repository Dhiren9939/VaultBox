import { Vault } from '#src/modules/vault/vault.model.js';
import User from '#src/modules/user/user.model.js';
import UserNotFoundError from '#src/errors/UserNotFoundError.js';

async function createVault(eDEK, salt, iv) {
  return await Vault.create({
    eDEK,
    salt,
    iv,
  });
}

async function getVaultKey(userId) {
  const user = await User.findOne({ _id: userId });
  if (!user) throw new UserNotFoundError('No user found with this id.');

  const { eDEK, salt, iv } = await Vault.findOne({ _id: user.vaultId });

  return { eDEK, salt, iv };
}

export { createVault, getVaultKey };
