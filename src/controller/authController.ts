import { errorCode } from "@/config/errorCode";
import { createError } from "@/utils/error";
import { NextFunction, Request, Response } from "express";

export const login = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (email) {
    return next(
      createError(
        "User already exists with this email address!",
        400,
        errorCode.userExist
      )
    );
  }

  res.status(200).json({ message: "Login successful" });
};
