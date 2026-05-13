import { CustomRequest } from "@/types/custom-type";
import type { NextFunction, Request, Response } from "express";

export const getAllUsers = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;

  res.status(200).json({ message: "Get all users", userId });
};
