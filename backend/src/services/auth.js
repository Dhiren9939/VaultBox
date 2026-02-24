import User from "../schemas/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function createUser(firstName, lastName, email, password, eDEK) {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User with this email already existed.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    firstName,
    lastName,
    email,
    hashedPassword,
    eDEK,
  });

  await user.save();
}

export async function createLoginToken(email, password) {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials.");
  
  const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isPasswordValid) throw new Error("Invalid credentials.");

  const token = jwt.sign(
    { firstName: user.firstName, lastName: user.lastName, email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  return token;
}
