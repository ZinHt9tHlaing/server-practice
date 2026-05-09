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

export const verifyOtpValidator = [body("")];

export const confirmPasswordValidator = [body("")];

export const LoginValidator = [body("")];
