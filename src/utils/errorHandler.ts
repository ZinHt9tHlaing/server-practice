import { Request, Response, NextFunction } from "express";

type AppError = {
  status: number;
  message: string;
  code: string;
};

export const errorHandler = async (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.status || 500;
  const message = error.message || "Server Error";
  const errorCode = error.code || "Error_Code"; // for refresh_token

  res.status(status).json({ message, error: errorCode });
  next();
};
