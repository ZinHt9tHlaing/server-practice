import { Response, NextFunction } from "express";
import { CustomRequest } from "@/types/custom-type";
import { getUserById } from "@/services/authServices";
import { AppError } from "@/types/error-type";
import { errorCode } from "@/config/errorCode";
import { Role } from "../../generated/prisma/enums";

// authorize( true, "ADMIN", "AUTHOR" ) => deny - "USER"
// authorize( false, "USER" ) => allow - "ADMIN", "AUTHOR"
// If the authorize function is called, a parameter will be added and the middleware will return
export const authorize = (permission: boolean, ...roles: Role[]) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;

    const user = await getUserById(userId!);
    if (!user) {
      const error: AppError = new Error("This account has not registered!");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    const result = roles.includes(user.role);
    // if permission is true and result is false
    if (permission && !result) {
      const error: AppError = new Error("This action is not allowed!");
      error.status = 403;
      error.code = errorCode.unauthorized;
      return next(error);
    }

    // if permission is false and result is true
    if (!permission && result) {
      const error: AppError = new Error("This action is not allowed!");
      error.status = 403;
      error.code = errorCode.unauthorized;
      return next(error);
    }

    req.user = user;
    next();
  };
};
