import type { Response } from "express";
import { CustomRequest } from "@/types/custom-type";

export const getAllUsers = (req: CustomRequest, res: Response) => {
  const userId = req.userId;

  res.status(200).json({ message: req.t("welcome"), userId });
};
