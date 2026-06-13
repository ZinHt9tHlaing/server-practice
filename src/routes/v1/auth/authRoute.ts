import {
  authCheck,
  changePassword,
  confirmPassword,
  forgetPassword,
  login,
  logout,
  register,
  resetPassword,
  verifyOtp,
  verifyOtpForPassword,
} from "@/controller/auth/authController";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { validationRequest } from "@/middlewares/validationRequest";
import {
  changePasswordValidator,
  confirmPasswordValidator,
  forgetPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  verifyOtpForPasswordValidator,
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

router.post(
  "/forget-password",
  forgetPasswordValidator,
  validationRequest,
  forgetPassword
);
router.post(
  "/verify-password",
  verifyOtpForPasswordValidator,
  validationRequest,
  verifyOtpForPassword
);
router.post(
  "/reset-password",
  resetPasswordValidator,
  validationRequest,
  resetPassword
);

router.get("/auth-check", authMiddleware, authCheck);
router.post(
  "/change-password",
  authMiddleware,
  changePasswordValidator,
  validationRequest,
  changePassword
);

export default router;
