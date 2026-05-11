import { ENV } from "@/config/env";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";

// Generate 6 digit OTP
export const generateOTP = (): number => {
  return (parseInt(randomBytes(3).toString("hex"), 16) % 900000) + 100000;
};

// Generate 64 digit token
export const generateToken = (): string => {
  return randomBytes(32).toString("hex");
};

export const generateAccessToken = (id: string) => {
  const accessToken = jwt.sign(
    { id },
    ENV.ACCESS_TOKEN_SECRET!,
    { expiresIn: 60 * 15 } // 15 minutes
  );

  return accessToken;
};

export const generateRefreshToken = (id: string, phone: string) => {
  const refreshToken = jwt.sign({ id, phone }, ENV.REFRESH_TOKEN_SECRET!, {
    expiresIn: "30d",
  });

  return refreshToken;
};
