import {
  confirmPassword,
  login,
  logout,
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

const router = express.Router();

router.post("/register", registerValidator, validationRequest, register);
router.post("/verify-otp", verifyOtpValidator, validationRequest, verifyOtp);
router.post(
  "/confirm-password",
  confirmPasswordValidator,
  validationRequest,
  confirmPassword
);
router.post("/login", loginValidator, validationRequest, login);
router.post("/logout", logout);

export default router;
