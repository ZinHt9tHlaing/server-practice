import { NextFunction, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { deleteImage, uploadSingleImage } from "@/config/cloudinary";
import { errorCode } from "@/config/errorCode";
import { CustomRequest } from "@/types/custom-type";
import { createError } from "@/utils/error";
import { getUserById, updateUser } from "@/services/authServices";
import { checkUserIfNotExist } from "@/utils/auth";
import { checkUploadFile } from "@/utils/check";

export const changeLanguage = async (req: CustomRequest, res: Response) => {
  const { lng } = req.query;

  res
    .status(200)
    .cookie("i18next", lng)
    .json({ message: req.t("changeLang", { lang: lng }) });
};

export const uploadProfile = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId as string;
  // local file path
  const image = req.file as Express.Multer.File;
  // Replace backslashes with forward slashes for All OS compatibility
  const filePath = image.path.replace("\\", "/");

  // const filePath = path.join(
  //   __dirname,
  //   "../../..",
  //   "/uploads/images",
  //   image.path
  // );

  const user = await getUserById(userId);
  checkUserIfNotExist(user);
  // check if file is uploaded
  checkUploadFile(image);

  // Delete old avatar with public id
  if (user?.image?.publicId) {
    await deleteImage(user.image.publicId);
  }

  let result;
  try {
    // upload to cloudinary
    result = await uploadSingleImage(filePath, "eShop.com/profile");

    if (result) {
      const userData = {
        image: {
          upsert: {
            create: {
              imageUrl: result.image_url,
              publicId: result.public_id,
            },
            update: {
              imageUrl: result.image_url,
              publicId: result.public_id,
            },
          },
        },
      };

      await updateUser(user!.id, userData);
    }
  } catch (error) {
    console.error("Error uploading image to cloudinary:", error);
    return next(
      createError(
        "Failed to upload image to cloudinary",
        500,
        errorCode.noImageUploaded
      )
    );
  } finally {
    // delete local file after upload success
    await fs.unlink(filePath).catch((error) => {
      console.error("Error deleting local file:", error);
      return next(
        createError(
          "Failed to delete local file",
          500,
          errorCode.failedToDeleteLocalFile
        )
      );
    });
  }

  res.status(200).json({
    message: "Profile image uploaded successfully",
    imageUrl: result?.image_url,
    public_id: result?.public_id,
  });
};

// Just for testing
export const getMyPhoto = (req: Request, res: Response): void => {
  const filePath = path.join(
    __dirname,
    "../../..",
    "uploads",
    "images",
    "1779176926027-179866275.jpeg"
  );

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send("File not found");
    }
  });
};
