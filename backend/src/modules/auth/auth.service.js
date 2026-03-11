import User from '#src/modules/user/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserExistsError from '#src/errors/userExistsError.js';
import InvalidCredentialsError from '#src/errors/invalidCredentialsError.js';
import { createVault } from '#src/modules/vault/vault.service.js';
import env from '#src/config/env.js';
import logger from '#src/utils/logger.js';
import { Vault } from '#src/modules/vault/vault.model.js';

function generateToken(id, email, firstName, lastName, vaultId) {
  const payload = {
    id,
    vaultId,
    email,
    firstName,
    lastName,
  };

  logger.debug(payload);
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN_SEC,
  });
  logger.debug(jwt.verify(token, env.JWT_SECRET));
  return token;
}

async function registerUser(
  firstName,
  lastName,
  email,
  password,
  eDEK,
  iv,
  salt
) {
  const existingUser = await User.findOne({ email });
  if (existingUser)
    throw new UserExistsError('User with same email already exists.');

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email,
      hashedPassword,
    });

    const vault = await createVault(user.id, eDEK, salt, iv);
    const token = generateToken(user.id, email, firstName, lastName, vault.id);

    return { userId: user.id, token };
  } catch (error) {
    if (error.code === 'E11000')
      throw new UserExistsError('User with same email already exists.');
    throw error;
  }
}

async function loginUser(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new InvalidCredentialsError('Invalid email or password.');

  const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isPasswordValid)
    throw new InvalidCredentialsError('Invalid email or password.');

  const vault = await Vault.findOne({ userId: user.id });
  const token = generateToken(
    user.id,
    email,
    user.firstName,
    user.lastName,
    vault.id
  );

  return { userId: user.id, token };
}

export { loginUser, registerUser };
