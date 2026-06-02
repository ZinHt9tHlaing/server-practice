import { Response, NextFunction } from "express";
import { CustomRequest } from "@/types/custom-type";
import { errorCode } from "@/config/errorCode";
import jwt from "jsonwebtoken";
import { ENV } from "../config/env";
import { getUserById, updateUser } from "@/services/authServices";
import { generateAccessToken, generateRefreshToken } from "@/utils/generate";
import { createError } from "@/utils/error";

interface ErrorTypes extends Error {
  name: string;
  status: number;
  message: string;
  code: string;
}

// Refresh Token api for mobile coz mobile does not have cookie
// request api -->
// <-- response error expired
// call refresh-token api -->
// <-- response 2 new tokens ( access & refresh token )
// request api with new access token -->

// Call every api include - 2 httpOnly cookies in Website
export const authMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  // Check platform with custom header ( eg: mobile )
  const platform = req.headers["x-platform"];
  if (platform === "mobile") {
    const accessTokenMobile = req.headers.authorization?.split(" ")[1];
    console.log("Request from Mobile", accessTokenMobile);
  } else {
    console.log("Request from Web");
  }

  const accessToken = req.cookies ? req.cookies.accessToken : null;
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    return next(
      createError(
        "You are not an authenticated user!",
        401,
        errorCode.unauthenticated
      )
    );
  }

  // Generate new tokens
  const generateNewTokens = async () => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
        id: string;
        phone: string;
      };
    } catch (err) {
      console.log("Error occurs while verifying token: ", err);
      return next(
        createError(
          "You are not an authenticated user!",
          401,
          errorCode.unauthenticated
        )
      );
    }

    const user = await getUserById(decoded.id);
    if (!user) {
      return next(
        createError(
          "You are not an authenticated user!",
          401,
          errorCode.unauthenticated
        )
      );
    }

    if (user.phone !== decoded.phone) {
      return next(
        createError(
          "This account has not registered!",
          401,
          errorCode.unauthenticated
        )
      );
    }

    // Check if refresh token is valid
    if (user.randomToken !== refreshToken) {
      return next(
        createError(
          "You are not an authenticated user!",
          401,
          errorCode.unauthenticated
        )
      );
    }

    // Generate new access and refresh token for authorized user
    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id, user.phone);

    // Update randomToken with new refresh token
    const userData = {
      randomToken: newRefreshToken,
    };
    await updateUser(user.id, userData);

    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: ENV.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: "/",
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: ENV.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

    req.userId = user.id;
    next();
  };

  if (!accessToken) {
    generateNewTokens(); // await generateNewTokens();
    // const error: AppError = new Error("Access Token has expired!");
    // error.status = 401;
    // error.code = errorCode.accessTokenExpired;
    // return next(error);
  } else {
    // verify access token
    let decoded;
    try {
      decoded = jwt.verify(accessToken, ENV.ACCESS_TOKEN_SECRET!) as {
        id: string;
      };
      req.userId = decoded.id;

      next();
    } catch (error: unknown) {
      const err = error as ErrorTypes;

      // If access token is expired, generate new tokens using refresh token
      if (err.name === "TokenExpiredError") {
        generateNewTokens(); // await generateNewTokens();
        // err.message = "Access Token has expired. Please log in again.";
        // err.status = 401;
        // err.code = errorCode.accessTokenExpired;
      } else {
        err.message = "Access token is invalid. Please log in again.";
        err.status = 401;
        err.code = errorCode.attack;
        return next(error);
      }
    }
  }
};
