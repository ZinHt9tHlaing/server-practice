import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";

import { errorCode } from "@/config/errorCode";
import {
  createOtp,
  createUser,
  getOtpByPhone,
  getUserByPhone,
  updateOtp,
  updateUser,
} from "@/services/authServices";
import {
  checkOtpErrorIfSameDate,
  checkOtpRow,
  checkUserExist,
} from "@/utils/auth";
import { createError } from "@/utils/error";
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
} from "@/utils/generate";
import { AppError } from "@/types/error-type";
import moment from "moment";
import { ENV } from "@/config/env";

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
  // const otp = generateOTP(); // For production use
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
    checkOtpErrorIfSameDate(isSameDate, otpRow.error); // if OTP request is in the same date

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

  const user = await getUserByPhone(phone);
  checkUserExist(user);

  const otpRow = await getOtpByPhone(phone);
  checkOtpRow(otpRow);

  const lastOtpVerify = new Date(otpRow!.updatedAt).toLocaleDateString();
  const today = new Date().toLocaleDateString();
  const isSameDate = lastOtpVerify === today;

  // if OTP request is in the same date and over limit
  checkOtpErrorIfSameDate(isSameDate, otpRow!.error);

  // Token is wrong
  if (otpRow?.rememberToken !== token) {
    const otpData = {
      error: 5,
    };
    await updateOtp(otpRow!.id, otpData);

    const error: AppError = new Error("Invalid Token");
    error.status = 400;
    error.code = errorCode.invalid;
    return next(error);
  }

  // OTP is expired
  const isOTPExpired = moment().diff(moment(otpRow?.updatedAt), "minutes") > 2; // 2 minutes
  if (isOTPExpired) {
    const error: AppError = new Error("OTP is expired");
    error.status = 403;
    error.code = errorCode.otpExpired;
    return next(error);
  }

  const isMatchOtp = await bcrypt.compare(otp, otpRow!.otp);
  // OTP is wrong
  if (!isMatchOtp) {
    // if OTP error is first time today
    if (!isSameDate) {
      const otpData = {
        error: 1,
      };
      await updateOtp(otpRow!.id, otpData);
    } else {
      const otpData = {
        error: {
          increment: 1,
        },
      };
      await updateOtp(otpRow!.id, otpData);
    }

    const error: AppError = new Error("OTP is incorrect");
    error.status = 401;
    error.code = errorCode.invalid;
    return next(error);
  }
  // All are OK
  const verifyToken = generateToken();
  const otpData = {
    verifyToken,
    error: 0,
    count: 1,
  };
  const result = await updateOtp(otpRow!.id, otpData);

  res.status(200).json({
    message: "OTP is successfully verified.",
    phone: result.phone,
    token: result.verifyToken,
  });
};

// Sending OTP --> Verify OTP --> Confirm Password = New Account
export const confirmPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phone, password, token } = req.body;

  const user = await getUserByPhone(phone);
  checkUserExist(user);

  const otpRow = await getOtpByPhone(phone);
  checkOtpRow(otpRow);

  // OTP error count is over limit
  if (otpRow?.error === 5) {
    const error: AppError = new Error("This request may be an attack!");
    error.status = 400;
    error.code = errorCode.attack;
    return next(error);
  }

  // Token is wrong
  if (otpRow?.verifyToken !== token) {
    const otpData = {
      error: 5,
    };
    await updateOtp(otpRow!.id, otpData);

    const error: AppError = new Error("Invalid Token");
    error.status = 400;
    error.code = errorCode.invalid;
    return next(error);
  }

  // request is expired
  const isExpired = moment().diff(moment(otpRow?.updatedAt), "minutes") > 2; // 2 minutes
  if (isExpired) {
    const error: AppError = new Error(
      "Your request is expired. Please try again!"
    );
    error.status = 403;
    error.code = errorCode.otpExpired;
    return next(error);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const randomToken = "I will replace Refresh Token soon.";

  const userData = {
    phone,
    password: hashedPassword,
    randomToken,
  };
  const newUser = await createUser(userData);

  // Generate access and refresh token
  const accessToken = generateAccessToken(newUser.id);
  const refreshToken = generateRefreshToken(newUser.id, newUser.phone);

  // Updating randomToken with refreshToken
  const userUpdateData = {
    randomToken: refreshToken,
  };

  await updateUser(newUser.id, userUpdateData);

  res
    .status(201)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: ENV.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: ENV.NODE_ENV === "production",
      sameSite: ENV.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    })
    .json({
      message: "Your account is successfully created.",
      userId: newUser.id,
    });
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
