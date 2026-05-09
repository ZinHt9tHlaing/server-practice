import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";

import { errorCode } from "@/config/errorCode";
import {
  createOtp,
  getOtpByPhone,
  getUserByPhone,
  updateOtp,
} from "@/services/authServices";
import { checkOtpErrorIfSameDate, checkUserExist } from "@/utils/auth";
import { createError } from "@/utils/error";
import { generateToken } from "@/utils/generate";
import { AppError } from "@/types/error-type";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let phone: string = req.body.phone;
  if (phone.slice(0, 2) === "09") {
    phone = phone.substring(2, phone.length);
  }

  const user = await getUserByPhone(phone);
  checkUserExist(user);

  // OTP sending logic here
  // Generate OTP & call OTP sending API
  // if sms OTP cannot be sent, response error
  // Save OTP in DB

  const otp = 123456; // For testing
  // const otp = generateOTP();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(otp.toString(), salt);
  const token = generateToken();

  const otpRow = await getOtpByPhone(phone);

  let result;
  if (!otpRow) {
    const otpData = {
      phone,
      otp: hashedOtp,
      rememberToken: token,
      count: 1,
    };

    result = await createOtp(otpData);
  } else {
    const lastOtpRequest = new Date(otpRow.updatedAt).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    const isSameDate = lastOtpRequest === today;
    checkOtpErrorIfSameDate(isSameDate, otpRow.error);

    // if OTP request is not in the same date
    if (!isSameDate) {
      const otpData = {
        otp: hashedOtp,
        rememberToken: token,
        count: 1,
        error: 0,
      };

      result = await updateOtp(otpRow.id, otpData);
    } else {
      // if OTP request is in the same date and OTP count is more than 3
      if (otpRow.count === 3) {
        const error: AppError = new Error(
          "OTP is allowed to request 3 times per day."
        );
        error.status = 405;
        error.code = errorCode.overLimit;
        return next(error);
      } else {
        // if OTP request is in the same date but not more than 3 times
        const otpData = {
          otp: hashedOtp,
          rememberToken: token,
          count: {
            increment: 1,
          },
        };
        result = await updateOtp(otpRow.id, otpData);
      }
    }
  }

  res.status(200).json({
    message: `OTP has been sent to 09${result?.phone}`,
    phone: result?.phone,
    token: result?.rememberToken,
  });
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phone, otp, token } = req.body;
};

export const confirmPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phone, password, token } = req.body;
};

export const login = (req: Request, res: Response, next: NextFunction) => {
  const { phone, password } = req.body;

  if (phone) {
    return next(
      createError(
        "User already exists with this phone address!",
        400,
        errorCode.userExist
      )
    );
  }

  res.status(200).json({ message: "Login successful" });
};
