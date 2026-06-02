import fs from "node:fs/promises";
import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { errorCode } from "../config/errorCode";
import { AppError } from "@/types/error-type";

export const validationRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req).array({
    onlyFirstError: true,
  });

  if (errors.length > 0) {
    if (req.files && Array.isArray(req.files)) {
      const deletePromises = (req.files as Express.Multer.File[]).map(
        async (file) => {
          try {
            await fs.unlink(file.path);
            console.log(
              `Temporary file deleted due to validation error: ${file.path}`
            );
          } catch (error) {
            console.error(`Failed to delete file: ${file.path}`, error);
          }
        }
      );

      await Promise.all(deletePromises);
    }

    if (req.file) {
      const file = req.file as Express.Multer.File;
      if (file.path) {
        await fs.unlink(file.path).catch(() => null);
        console.log(`Single temporary file deleted: ${file.path}`);
      }
    }

    const error: AppError = new Error(errors[0].msg);
    error.status = 400;
    error.code = errorCode.invalid;

    return next(error);
  }

  next();
};
