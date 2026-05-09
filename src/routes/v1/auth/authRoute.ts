import {
  confirmPassword,
  login,
  register,
  verifyOtp,
} from "@/controller/auth/authController";
import { validationRequest } from "@/middlewares/validationRequest";
import { registerValidator } from "@/validators/authValidators";
import express from "express";

const authRoute = express.Router();

authRoute.post("/register", registerValidator, validationRequest, register);
authRoute.post("/verify-otp", verifyOtp);
authRoute.post("/confirm-password", confirmPassword);
authRoute.post("/login", login);

export default authRoute;
