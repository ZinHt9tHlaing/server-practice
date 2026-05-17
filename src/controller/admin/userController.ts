import type { Response } from "express";
import { CustomRequest } from "@/types/custom-type";
import { authorize } from "@/utils/authorize";
import { getUserById } from "@/services/authServices";
import { checkUserIfNotExist } from "@/utils/auth";

export const getAllUsers = (req: CustomRequest, res: Response) => {
  const user = req.user;

  res
    .status(200)
    .json({ message: req.t("welcome"), currentUserRole: user?.role });
};

export const textPermission = async (req: CustomRequest, res: Response) => {
  const userId = req.userId;
  const user = await getUserById(userId!);
  checkUserIfNotExist(user);

  const info: { title: string; content?: string } = {
    title: "Testing Permission",
  };

  // if user.role === "AUTHOR"
  // content = "You are an author."
  const canEnter = authorize(true, user!.role, "AUTHOR");
  if (canEnter) {
    info.content = " You have permission to read this line.";
  }

  res
    .status(200)
    .json({ message: "You have permission to access this route!", info });
};
