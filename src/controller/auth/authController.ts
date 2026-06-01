import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";

import { errorCode } from "@/config/errorCode";
import {
  createOtp,
  createUser,
  getOtpByPhone,
  getUserById,
  getUserByPhone,
  updateOtp,
  updateUser,
} from "@/services/authServices";
import {
  checkOtpErrorIfSameDate,
  checkOtpRow,
  checkUserExist,
  checkUserIfNotExist,
} from "@/utils/auth";
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
} from "@/utils/generate";
import { AppError } from "@/types/error-type";
import moment from "moment";
import { ENV } from "@/config/env";
import { CustomRequest } from "@/types/custom-type";
import jwt from "jsonwebtoken";
import { createError } from "@/utils/error";

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
        return next(
          createError(
            "OTP is allowed to request 3 times per day.",
            405,
            errorCode.overLimit
          )
        );
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

    return next(createError("Invalid Token", 400, errorCode.invalid));
  }

  // OTP is expired
  const isOTPExpired = moment().diff(moment(otpRow?.updatedAt), "minutes") > 2; // 2 minutes
  if (isOTPExpired) {
    return next(createError("OTP is expired", 403, errorCode.otpExpired));
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

    return next(createError("OTP is incorrect", 401, errorCode.invalid));
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
    return next(
      createError("This request may be an attack!", 400, errorCode.attack)
    );
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
    return next(
      createError(
        "Your request is expired. Please try again!",
        403,
        errorCode.otpExpired
      )
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const randomToken = "I will replace Refresh Token soon.";

  // Create a new account
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

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const password = req.body.password;
  let phone: string = req.body.phone;
  if (phone.slice(0, 2) === "09") {
    phone = phone.substring(2, phone.length);
  }

  // Check if user doesn't exist
  const user = await getUserByPhone(phone);
  checkUserIfNotExist(user);

  // wrong password is over limit
  if (user?.status === "FREEZE") {
    return next(
      createError(
        "Your account is temporarily locked. Please contact us!",
        401,
        errorCode.accountFreeze
      )
    );
  }

  const isMatchPassword = await bcrypt.compare(password, user!.password);
  if (!isMatchPassword) {
    // --------- Starting to record wrong times
    const lastRequest = new Date(user!.updatedAt).toLocaleDateString();
    const isSameDate = lastRequest === new Date().toLocaleDateString();

    // Today password is wrong first time
    if (!isSameDate) {
      const userData = {
        errorLoginCount: 1,
      };
      await updateUser(user!.id, userData);
    } else {
      // Today password was wrong 2 times
      if (user!.errorLoginCount >= 2) {
        const userData = {
          status: "FREEZE" as const,
        };
        await updateUser(user!.id, userData);
      } else {
        // Today password was wrong 1 times
        const userData = {
          errorLoginCount: {
            increment: 1,
          },
        };
        await updateUser(user!.id, userData);
      }
    }

    // --------- Ending -----------------------
    return next(
      createError(
        "Password is incorrect. If you enter wrong password 3 times, your account will be temporarily locked.",
        401,
        errorCode.invalid
      )
    );
  }

  // Generate access and refresh token
  const accessToken = generateAccessToken(user!.id);
  const refreshToken = generateRefreshToken(user!.id, user!.phone);

  // Update randomToken with refreshToken
  const userData = {
    errorLoginCount: 0, // reset error count
    randomToken: refreshToken,
  };

  await updateUser(user!.id, userData);

  res
    .status(200)
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
      message: "Successfully Logged In.",
      userId: user?.id,
    });
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;
  if (!refreshToken) {
    return next(
      createError(
        "You are not an authenticated use!",
        401,
        errorCode.unauthenticated
      )
    );
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, ENV.REFRESH_TOKEN_SECRET!) as {
      id: string;
      phone: string;
    };
  } catch (err) {
    return next(
      createError(
        "You are not an authenticated use!",
        401,
        errorCode.unauthenticated
      )
    );
  }

  const user = await getUserById(decoded.id);
  checkUserIfNotExist(user);

  if (user?.phone !== decoded.phone) {
    return next(
      createError(
        "You are not an authenticated use!",
        401,
        errorCode.unauthenticated
      )
    );
  }

  // Update randomToken
  const userData = {
    randomToken: generateToken(),
  };
  await updateUser(user!.id, userData);

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
  });

  return res.status(200).json({ message: "Successfully Logged Out." });
};

export const forgetPassword = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  let phone = req.body.phone as string;
  if (phone.slice(0, 2) === "09") {
    phone = phone.substring(2, phone.length);
  }

  const user = await getUserByPhone(phone);
  checkUserIfNotExist(user);

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
  // Warning - Your app may let users change their phone number.
  // if so, you need to check if phone number exists in OTP table

  let result;

  const lastOtpRequest = new Date(otpRow!.updatedAt).toLocaleDateString();
  const today = new Date().toLocaleDateString();
  const isSameDate = lastOtpRequest === today;
  checkOtpErrorIfSameDate(isSameDate, otpRow!.error);
  // If OTP request is not the same date
  if (!isSameDate) {
    const otpData = {
      otp: hashedOtp,
      rememberToken: token,
      count: 1,
      error: 0,
    };
    result = await updateOtp(otpRow!.id, otpData);
  } else {
    // If OTP request is not the same date and over limit
    if (otpRow!.count === 3) {
      return next(
        createError(
          "OTP is allowed to request 3 times per day.",
          405,
          errorCode.overLimit
        )
      );
    } else {
      // If OTP request is not the same date and not over limit
      const otpData = {
        otp: hashedOtp,
        rememberToken: token,
        count: {
          increment: 1,
        },
      };
      result = await updateOtp(otpRow!.id, otpData);
    }
  }

  res.status(200).json({
    message: `We are sending OTP to 09${result.phone} to reset password`,
    phone: result.phone,
    token: result.rememberToken,
  });
};

export const verifyOtpForPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phone, otp, token } = req.body;

  const user = await getUserByPhone(phone);
  checkUserIfNotExist(user);

  const otpRow = await getOtpByPhone(phone);
  checkOtpRow(otpRow);

  const lastOtpVerify = new Date(otpRow!.updatedAt).toLocaleDateString();
  const today = new Date().toLocaleDateString();
  const isSameDate = lastOtpVerify === today;
  // If OTP verify is in the same date and over limit
  checkOtpErrorIfSameDate(isSameDate, otpRow!.error);

  // Token is wrong
  if (otpRow?.rememberToken !== token) {
    const otpData = {
      error: 5,
    };
    await updateOtp(otpRow!.id, otpData);

    return next(createError("Invalid token.", 400, errorCode.invalid));
  }

  // OTP is expired
  const isOTPExpired = moment().diff(otpRow!.updatedAt, "minutes") > 2;
  if (isOTPExpired) {
    return next(createError("OTP is expired.", 403, errorCode.otpExpired));
  }

  const isMatchOTP = await bcrypt.compare(otp, otpRow!.otp);
  // OTP is wrong
  if (!isMatchOTP) {
    // If OTP error is first time today
    if (isSameDate) {
      const otpData = {
        error: 1,
      };

      await updateOtp(otpRow!.id, otpData);
    } else {
      // If OTP error is not first time today
      const otpData = {
        error: {
          increment: 1,
        },
      };

      await updateOtp(otpRow!.id, otpData);
    }

    const error: AppError = new Error("OTP is incorrect.");
    error.status = 401;
    error.code = errorCode.invalid;
    return next(error);
  }

  // All are ok
  const verifyToken = generateToken();
  const otpData = {
    verifyToken,
    error: 0,
    count: 1,
  };

  const result = await updateOtp(otpRow!.id, otpData);

  res.status(200).json({
    message: "OTP is successfully verified to reset password.",
    phone: result.phone,
    token: result.verifyToken,
  });
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { phone, password, token } = req.body;

  const user = await getUserByPhone(phone);
  checkUserIfNotExist(user);

  const otpRow = await getOtpByPhone(phone);

  if (otpRow?.error === 5) {
    return next(
      createError(
        "This request may be an attack. It not, try again tomorrow.",
        401,
        errorCode.attack
      )
    );
  }

  if (otpRow?.verifyToken !== token) {
    const otpData = {
      error: 5,
    };
    await updateOtp(otpRow!.id, otpData);

    return next(createError("Invalid token.", 400, errorCode.invalid));
  }

  // request is expired
  const isExpired = moment().diff(otpRow!.updatedAt, "minutes") > 5;
  if (isExpired) {
    return next(
      createError(
        "Your request is expired. Please try again.",
        403,
        errorCode.otpExpired
      )
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(password, salt);

  // jwt token
  const accessToken = generateAccessToken(user!.id);
  const refreshToken = generateRefreshToken(user!.id, user!.phone);

  const userData = {
    password: hashPassword, // reset error count
    randomToken: refreshToken,
  };

  await updateUser(user!.id, userData);

  res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: "/",
    })
    .cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    })
    .json({
      message: "Successfully reset your password.",
      userId: user?.id,
    });
};

export const authCheck = async (req: CustomRequest, res: Response) => {
  const userId = req.userId as string;
  const user = await getUserById(userId);
  checkUserIfNotExist(user);

  const fullName = `${user?.firstName} ${user?.lastName}`;

  res.status(200).json({
    message: "You are a authenticated user.",
    userId: user?.id,
    username: fullName,
    image: user?.image,
  });
};
