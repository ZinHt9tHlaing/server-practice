import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { errorCode } from "../config/errorCode";
import { AppError } from "@/types/error-type";

export const validationRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req).array({
    onlyFirstError: true,
  });

  if (errors.length > 0) {
    const error: AppError = new Error(errors[0].msg);

    error.status = 400;
    error.code = errorCode.invalid;

    return next(error);
  }

  next();
};
