import { randomBytes } from "crypto";

// Generate 6 digit OTP
export const generateOTP = (): number => {
  return (parseInt(randomBytes(3).toString("hex"), 16) % 900000) + 100000;
};

// Generate 64 digit token
export const generateToken = (): string => {
  return randomBytes(32).toString("hex");
};
