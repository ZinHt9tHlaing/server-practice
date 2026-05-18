import type { Response } from "express";
import { CustomRequest } from "@/types/custom-type";
import { createOrUpdateSetting } from "@/services/settingServices";

export const setMaintenance = async (req: CustomRequest, res: Response) => {
  const { mode } = req.body;

  const value = mode ? "true" : "false";
  const message = mode
    ? "Maintenance mode enabled"
    : "Maintenance mode disabled";

  await createOrUpdateSetting("maintenance_mode", value);

  res.status(200).json({ message });
};
