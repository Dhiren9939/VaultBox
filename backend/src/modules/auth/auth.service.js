import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '#src/config/env.js';
import InvalidCredentialsError from '#src/errors/InvalidCredentialsError.js';
import InvalidRefreshToken from '#src/errors/InvalidRefreshToken.js';
import UserExistsError from '#src/errors/UserExistsError.js';
import logger from '#src/utils/logger.js';
import User from '#src/modules/user/user.model.js';
import { Vault } from '#src/modules/vault/vault.model.js';
import { createVault } from '#src/modules/vault/vault.service.js';
import RefreshToken from '#src/modules/auth/auth.model.js';
import { DeadDrop } from '#src/modules/dead-drops/dead-drop.model.js';

function buildUserPayload(user, vaultId) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    vaultId,
    fAttributes: user.fAttributes || null,
  };
}

function generateAccessToken(user, vaultId) {
  const payload = buildUserPayload(user, vaultId);

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN_SEC,
  });
}

function generateRefreshToken(userId) {
  const refreshToken = crypto.randomBytes(24).toString('hex');
  return `${userId}:${refreshToken}`;
}

function getUserIdFromRefreshToken(refreshToken) {
  return refreshToken.split(':')[0];
}

function hashRefreshToken(refreshToken) {
  const hash = crypto.createHash('sha256');
  hash.update(refreshToken);
  return hash.digest('hex');
}

function accessTokenPayload(accessToken) {
  return jwt.verify(accessToken, env.JWT_SECRET);
}

async function saveRefreshToken(userId, refreshToken) {
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_SEC * 1000
  );
  const createdAt = new Date();

  await RefreshToken.findOneAndUpdate(
    { userId },
    { tokenHash, createdAt, expiresAt },
    { upsert: true }
  );
}

async function registerUser(
  firstName,
  lastName,
  email,
  password,
  eDEK,
  reDEK,
  kIv,
  rIv,
  kSalt,
  rSalt,
  fAttributes,
  publicKey,
  encryptedPrivateKey,
  rsaIv
) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new UserExistsError('User with same email already exists.');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email,
      hashedPassword,
      fAttributes,
      publicKey,
      encryptedPrivateKey,
      rsaIv,
    });

    const vault = await createVault(
      user.id,
      eDEK,
      reDEK,
      kSalt,
      rSalt,
      kIv,
      rIv
    );
    const accessToken = generateAccessToken(user, vault.id);
    const refreshToken = generateRefreshToken(user.id);

    await DeadDrop.create({ userId: user.id });

    await saveRefreshToken(user.id, refreshToken);

    return {
      user: buildUserPayload(user, vault.id),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error.code === 'E11000') {
      throw new UserExistsError('User with same email already exists.');
    }
    throw error;
  }
}

/**
 * Validates credentials and returns auth tokens + user payload.
 */
async function loginUser(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new InvalidCredentialsError('Invalid credentials.');

  const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isPasswordValid)
    throw new InvalidCredentialsError('Invalid credentials.');

  const vault = await Vault.findOne({ userId: user.id });
  if (!vault) {
    logger.warn('Vault missing for user during login.', { userId: user.id });
    throw new InvalidCredentialsError('Invalid credentials.');
  }

  const accessToken = generateAccessToken(user, vault.id);
  const refreshToken = generateRefreshToken(user.id);

  await saveRefreshToken(user.id, refreshToken);

  return {
    user: buildUserPayload(user, vault.id),
    accessToken,
    refreshToken,
  };
}

/**
 * Validates refresh token and issues a new access/refresh pair.
 */
async function refreshAccessToken(usersRefreshToken) {
  if (!usersRefreshToken) {
    throw new InvalidRefreshToken('Refresh token is invalid. Please login.');
  }

  const parsedUserId = getUserIdFromRefreshToken(usersRefreshToken);

  const user = await User.findById(parsedUserId);
  if (!user) {
    throw new InvalidRefreshToken('Refresh token is invalid. Please login.');
  }

  const storedRefreshToken = await RefreshToken.findOne({ userId: user.id });

  if (
    !storedRefreshToken ||
    storedRefreshToken.tokenHash !== hashRefreshToken(usersRefreshToken) ||
    storedRefreshToken.expiresAt < new Date()
  ) {
    throw new InvalidRefreshToken('Refresh token is invalid. Please login.');
  }

  const vault = await Vault.findOne({ userId: user.id });
  if (!vault) {
    throw new InvalidRefreshToken('Refresh token is invalid. Please login.');
  }

  const newAccessToken = generateAccessToken(user, vault.id);
  const newRefreshToken = generateRefreshToken(user.id);

  await saveRefreshToken(user.id, newRefreshToken);

  return {
    user: buildUserPayload(user, vault.id),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Removes the stored refresh token for a user.
 */
async function logUserOut(userId) {
  const storedRefreshToken = await RefreshToken.findOne({ userId });

  if (!storedRefreshToken) {
    logger.warn('User without stored refreshToken tried to logout.');
    return;
  }

  await RefreshToken.deleteOne({ userId });
}

export {
  registerUser,
  loginUser,
  accessTokenPayload,
  refreshAccessToken,
  logUserOut,
};
