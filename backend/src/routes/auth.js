import express from "express";
import { handleLogin, handleRegister } from "../controllers/auth.controller.js";
import {
    validateRegisterBody,
    validateLoginBody,
} from "../middleware/authValidation.js";
import handleValidationErrors from "../middleware/handleValidationErrors.js";

const authRouters = express.Router();

authRouters.post(
    "/api/auth/register",
    [validateRegisterBody, handleValidationErrors()],
    handleRegister,
);

authRouters.post(
    "/api/auth/login",
    [validateLoginBody, handleValidationErrors()],
    handleLogin,
);

export default authRouters;
