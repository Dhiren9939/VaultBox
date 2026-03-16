import User from '#src/modules/user/user.model.js';
import UserExistsError from '#src/errors/UserExistsError.js';
import UserNotFoundError from '#src/errors/UserNotFoundError.js';
import { Vault } from '#src/modules/vault/vault.model.js';
import RefreshToken from '#src/modules/auth/auth.model.js';

function buildUserProfile(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

async function getUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user) throw new UserNotFoundError('User not found.');
  return buildUserProfile(user);
}

async function updateUserProfile(userId, updates) {
  const user = await User.findById(userId);
  if (!user) throw new UserNotFoundError('User not found.');

  if (updates.email && updates.email !== user.email) {
    const emailOwner = await User.findOne({
      email: updates.email,
      _id: { $ne: userId },
    });
    if (emailOwner) {
      throw new UserExistsError('User with same email already exists.');
    }
  }

  if (typeof updates.firstName === 'string') user.firstName = updates.firstName;
  if (typeof updates.lastName === 'string') user.lastName = updates.lastName;
  if (typeof updates.email === 'string') user.email = updates.email;

  await user.save();

  return buildUserProfile(user);
}

async function deleteUserAccount(userId) {
  const user = await User.findById(userId);
  if (!user) throw new UserNotFoundError('User not found.');

  await Promise.all([
    Vault.deleteOne({ userId }),
    RefreshToken.deleteOne({ userId }),
    User.deleteOne({ _id: userId }),
  ]);

  return { userId };
}

export { getUserProfile, updateUserProfile, deleteUserAccount };
