import { Request, Response, NextFunction } from "express";

export interface CustomRequest extends Request {
  userId?: number;
}

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