import { Response, NextFunction } from "express";
import { CustomRequest } from "@/types/custom-type";

export const checkMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  // const err: any = new Error("Token has expired.");
  // err.status = 401;
  // err.code = "Error_TokenExpired";
  // return next(err)

  req.userId = 12345;
  next();
};
