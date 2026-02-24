import { createLoginToken, createUser } from "../services/auth.js";

export async function handleRegister(req, res) {
  const { firstName, lastName, email, password, eDEK } = req.body;

  createUser(firstName, lastName, email, password, eDEK);

  res.statusSend(201);
}

export async function handleLogin(req, res) {
  const { email, password } = req.body;

  let token = await createLoginToken(email, password);

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.statusSend(200);
}
