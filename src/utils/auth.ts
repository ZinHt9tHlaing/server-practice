import { AppError } from "@/types/error-type";
import { Prisma } from "../../generated/prisma/client";
import { createError } from "./error";
import { errorCode } from "@/config/errorCode";

export const checkUserExist = (user: Prisma.UserModel | null) => {
  if (user) {
    const error = createError(
      "This phone number has already been registered",
      409,
      errorCode.userExist
    );
    throw error;
  }
};

export const checkOtpErrorIfSameDate = (
  isSameDate: boolean,
  errorCount: number
) => {
  if (isSameDate && errorCount === 5) {
    const error: AppError = new Error(
      "OTP is wrong for 5 times. Please try again tomorrow."
    );
    error.status = 401;
    error.code = errorCode.overLimit;
    throw error;
  }
};

export const checkOtpRow = (otpRow: Prisma.OtpModel | null) => {
  if (!otpRow) {
    const error: AppError = new Error("Phone number is incorrect.");
    error.status = 400;
    error.code = errorCode.invalid;
    throw error;
  }
};
