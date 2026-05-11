import { body } from "express-validator";

export const registerValidator = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches("^[0-9]+$") // only numbers allowed
    .withMessage("Phone number must contain only numbers")
    .isLength({ min: 5, max: 12 }) // at least 5 and at most 12 digits
    .withMessage("Phone number must be between 5 and 12 digits"),
];

export const verifyOtpValidator = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches("^[0-9]+$")
    .withMessage("Phone number must contain only numbers")
    .isLength({ min: 5, max: 12 })
    .withMessage("Phone number must be between 5 and 12 digits"),
  body("otp", "Invalid OTP")
    .trim()
    .notEmpty()
    .withMessage("OTP is required")
    .matches("^[0-9]+$") // only numbers allowed
    .withMessage("OTP must contain only numbers")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits"),
  body("token", "Invalid token").trim().notEmpty().escape(), // remove special characters
];

export const confirmPasswordValidator = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches("^[0-9]+$")
    .withMessage("Phone number must contain only numbers")
    .isLength({ min: 5, max: 12 })
    .withMessage("Phone number must be between 5 and 12 digits"),
  body("password", "Password must be 8 digits")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 8 }),
  body("token", "Invalid token").trim().notEmpty().escape(), // remove special characters
];

export const loginValidator = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches("^[0-9]+$")
    .withMessage("Phone number must contain only numbers")
    .isLength({ min: 5, max: 12 })
    .withMessage("Phone number must be between 5 and 12 digits"),
  body("password", "Password must be 8 digits")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8, max: 8 })
];
