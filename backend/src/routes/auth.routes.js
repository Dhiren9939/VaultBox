import express from "express";
import { handleLogin, handleRegister } from "../controllers/auth.controller.js";
import { validateRegisterBody } from "../middleware/user.middleware.js";
import handleValidationErrors from "../middleware/handleValidationErrors.js";

const authRouters = express.Router();

authRouters.post(
  "/api/auth/register",
  validateRegisterBody,
  handleValidationErrors(),
  handleRegister,
);

authRouters.post("/api/auth/login", handleLogin);

export default authRouters;
