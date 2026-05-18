import { Request, Response, NextFunction } from "express";
import { getSettingStatus } from "@/services/settingServices";
import { errorCode } from "@/config/errorCode";
import { createError } from "@/utils/error";

// Allow localhost
const whiteLists = ["127.0.0.1"];

export const maintenance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Get the client's IP address
  const forwardedIp = req.headers["x-forwarded-for"];

  const ip =
    typeof forwardedIp === "string"
      ? forwardedIp
      : req.socket.remoteAddress || "";

  if (whiteLists.includes(ip)) {
    console.log(`Allowed IP: ${ip}`);
    next();
  } else {
    console.log(`Not Allowed IP: ${ip}`);
    const setting = await getSettingStatus("maintenance_mode");
    if (setting?.value === "true") {
      return next(
        createError(
          "The server is currently under maintenance. Please try again later.",
          503,
          errorCode.maintenance
        )
      );
    }
  }

  next();
};
