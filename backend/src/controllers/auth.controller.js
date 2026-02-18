import User from "../schemas/user.schema.js";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";

export async function handleRegister(req, res) {
  const { firstName, lastName, email, password, eDEK, rDEK } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({ emailError: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    firstName,
    lastName,
    email,
    hashedPassword,
    eDEK,
    rDEK,
  });
  try {
    await user.save();
  } catch (error) {
    console.error("Error saving user:", error);
    return res.status(500).json({ error: "Failed to register user" });
  }

  res.status(201).json({ message: "User registered successfully" });
}

export async function handleLogin(req, res) {
  const { email, password } = req.body;

  const user = User.findOne({ email });

  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

  if (!isPasswordValid) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { firstName: user.firstName, lastName: user.lastName, email },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.status(200).json({ message: "Login successful" });
}
