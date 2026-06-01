import type { Response } from "express";
import { CustomRequest } from "@/types/custom-type";
import { checkUploadFile } from "@/utils/check";
import generateCloudinaryPath from "@/config/cloudinary/generateCloudinaryPath";
import ImageQueue from "@/jobs/queues/imageQueue";
import { createOnePost } from "@/services/postServices";

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

export const updatePost = async (req: CustomRequest, res: Response) => {
  const { postId, title, content, body, category, type, tags } = req.body;
  // const user = req.userId;
  const user = req.user;
  checkUploadFile(req.file);

  res.status(200).json({ title, content });
};

export const deletePost = async (req: CustomRequest, res: Response) => {
  const { title, content, body, category, type, tags } = req.body;

  res.status(200).json({ title, content });
};
