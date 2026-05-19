import { AppError } from "@/types/error-type";
import { errorCode } from "../config/errorCode";

export const checkUploadFile = (file: Express.Multer.File | undefined) => {
  if (!file) {
    const error: AppError = new Error("Invalid Image.");
    error.status = 409;
    error.code = errorCode.invalid;
    throw error;
  }
};
