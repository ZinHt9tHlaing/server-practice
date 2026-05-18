import { Response, NextFunction } from "express";
import { CustomRequest } from "@/types/custom-type";
import { getUserById } from "@/services/authServices";
import { errorCode } from "@/config/errorCode";
import { Role } from "../../generated/prisma/enums";
import { createError } from "@/utils/error";

// authorize( true, "ADMIN", "AUTHOR" ) => deny - "USER"
// authorize( false, "USER" ) => allow - "ADMIN", "AUTHOR"
// If the authorize function is called, a parameter will be added and the middleware will return
export const authorize = (permission: boolean, ...roles: Role[]) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;

    const user = await getUserById(userId!);
    if (!user) {
      return next(
        createError(
          "You are not an authenticated user!",
          401,
          errorCode.unauthenticated
        )
      );
    }

    const result = roles.includes(user.role);
    // if permission is true and result is false
    if (permission && !result) {
      return next(
        createError("This action is not allowed!", 403, errorCode.unauthorized)
      );
    }

    // if permission is false and result is true
    if (!permission && result) {
      return next(
        createError("This action is not allowed!", 403, errorCode.unauthorized)
      );
    }

    req.user = user;
    next();
  };
};
