import { AppError } from "@/types/error-type";

export const createError = (
  message: string,
  status: number,
  errorCode: string
) => {
  const error: AppError = new Error(message);
  error.status = status;
  error.code = errorCode;
  return error;
};
