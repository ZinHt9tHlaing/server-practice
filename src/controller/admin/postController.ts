import path from "path";
import { unlink } from "fs/promises";
import type { NextFunction, Response } from "express";
import { CustomRequest } from "@/types/custom-type";
import { checkUploadFile } from "@/utils/check";
import generateCloudinaryPath from "@/config/cloudinary/generateCloudinaryPath";
import ImageQueue from "@/jobs/queues/imageQueue";
import {
  PostArgs,
  createOnePost,
  deleteOnePost,
  getPostById,
  updateOnePost,
} from "@/services/postServices";
import { createError } from "@/utils/error";
import { errorCode } from "@/config/errorCode";
import { getUserById } from "@/services/authServices";
import { checkUserIfNotExist } from "@/utils/auth";
import { deleteImage } from "@/config/cloudinary/deleteImage";

export const removeFiles = async (
  originalFile: string,
  optimizedFile: string | null
) => {
  try {
    // get old image file path
    const originalFilePath = path.join(
      __dirname,
      "../../../",
      "uploads/images",
      originalFile
    );

    await unlink(originalFilePath);

    // get old optimized image file path
    if (optimizedFile) {
      const optimizedFilePath = path.join(
        __dirname,
        "../../..",
        "/uploads/optimize",
        optimizedFile
      );

      await unlink(optimizedFilePath);
    }
  } catch (error) {
    console.log("No image found.", error);
  }
};

// creating post
export const createPost = async (req: CustomRequest, res: Response) => {
  const userId = req.userId as string;
  const { title, content, body, category, type, tags } = req.body;
  const images = req.files as Express.Multer.File[];
  checkUploadFile(images);

  const folderName = "eShop.com/post";

  const uploadImgPromises = images.map(async (image) => {
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Generate cloudinary path
    const { publicId, imageUrl } = generateCloudinaryPath({
      folderName,
      fileName: uniqueFileName,
    });

    await ImageQueue.add("optimize-post-image", {
      source: image.buffer
        ? { type: "buffer", data: image.buffer.toString("base64") }
        : { type: "file", path: image.path },
      width: 835,
      height: 577,
      quality: 100,
      fileName: uniqueFileName,
      folderName: folderName,
    });

    return { imageUrl, publicId };
  });

  const uploadedImages = await Promise.all(uploadImgPromises);

  const post = await createOnePost({
    title,
    content,
    body,
    category,
    type,
    tags,
    images: uploadedImages,
    authorId: userId,
  });

  res.status(200).json({
    message: "Successfully created a new post.",
    postId: post.id,
  });
};

export const updatePost = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const { postId, title, content, body, category, type, tags } = req.body;
  const userId = req.userId;
  const images = req.files as Express.Multer.File[];
  const user = await getUserById(userId as string);
  checkUserIfNotExist(user);

  const post = await getPostById(postId);
  if (!post) {
    return next(createError("Post not found!", 404, errorCode.invalid));
  }

  // admin A --> Post A --> allow to update/delete
  // admin B --> Post A --> don't allow to update/delete
  if (user?.id !== post.authorId) {
    return next(
      createError("This action is not allowed.", 403, errorCode.unauthenticated)
    );
  }

  const data: PostArgs = {
    title,
    content,
    body,
    category,
    type,
    tags,
  };

  // upload new image
  if (images) {
    const folderName = "eShop.com/post";
    const oldImagePublicIds =
      post.images && post.images.length > 0
        ? post.images.map((img) => img.publicId)
        : undefined;

    const uploadImgPromises = images.map(async (image) => {
      const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      // Generate cloudinary path
      const { publicId, imageUrl } = generateCloudinaryPath({
        folderName,
        fileName: uniqueFileName,
      });

      await ImageQueue.add("optimize-post-image", {
        source: image.buffer
          ? { type: "buffer", data: image.buffer.toString("base64") }
          : { type: "file", path: image.path },
        width: 835,
        height: 577,
        quality: 100,
        fileName: uniqueFileName,
        folderName: folderName,
        oldPublicIds: image ? oldImagePublicIds : undefined,
      });

      return { imageUrl, publicId };
    });

    data.images = await Promise.all(uploadImgPromises);
  }

  const updatedPost = await updateOnePost(postId, data);

  res.status(200).json({
    message: "Successfully updated the post.",
    postData: updatedPost.id,
  });
};

export const deletePost = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const { postId } = req.body;
  const userId = req.userId as string;
  const user = await getUserById(userId);
  checkUserIfNotExist(user);

  const post = await getPostById(postId);
  if (!post) {
    return next(createError("Post not found!", 404, errorCode.invalid));
  }

  if (user?.id !== post.authorId) {
    return next(
      createError("This action is not allowed.", 403, errorCode.unauthenticated)
    );
  }

  // delete old image
  if (post.images && post.images.length > 0) {
    await Promise.all(
      post.images.map(async (image) => {
        await deleteImage(image.publicId)
          .then(() => {
            console.log("Successfully deleted the image.");
          })
          .catch((err) => {
            console.error("Failed to delete image!", err);
          });
      })
    );
  }

  const postDeleted = await deleteOnePost(post.id);

  res.status(200).json({
    message: "Successfully deleted the post.",
    postId: postDeleted.id,
  });
};
