import { Request } from "express";
import { Prisma } from "../../generated/prisma/client";

export interface CustomRequest extends Request {
  userId?: string;
  user?: Prisma.UserModel;
}
