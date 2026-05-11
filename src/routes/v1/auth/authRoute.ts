import {
  confirmPassword,
  login,
  register,
  verifyOtp,
} from "@/controller/auth/authController";
import { validationRequest } from "@/middlewares/validationRequest";
import {
  confirmPasswordValidator,
  loginValidator,
  registerValidator,
  verifyOtpValidator,
} from "@/validators/authValidators";
import express from "express";

const authRoute = express.Router();

authRoute.post("/register", registerValidator, validationRequest, register);
authRoute.post("/verify-otp", verifyOtpValidator, validationRequest, verifyOtp);
authRoute.post(
  "/confirm-password",
  confirmPasswordValidator,
  validationRequest,
  confirmPassword
);
authRoute.post("/login", loginValidator, validationRequest, login);

export default authRoute;
