import User from '#src/modules/user/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserExistsError from '#src/errors/userExistsError.js';
import InvalidCredentialsError from '#src/errors/invalidCredentialsError.js';
import { createVault } from '#src/modules/vault/vault.service.js';

function generateToken(id, email, firstName, lastName) {
  const payload = {
    id,
    email,
    firstName,
    lastName,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
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
  const hashedPassword = await bcrypt.hash(password, 12);

  const existingUser = await User.findOne({ email });
  if (existingUser)
    throw new UserExistsError('User with same email already exists.');

  try {
    const vault = await createVault(eDEK, salt, iv);

    const user = await User.create({
      firstName,
      lastName,
      email,
      hashedPassword,
      vaultId: vault.id,
    });

    const token = generateToken(user.id, email, firstName, lastName);

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

  const token = generateToken(user.id, email, user.firstName, user.lastName);

  return { userId: user.id, token };
}

export { loginUser, registerUser };
