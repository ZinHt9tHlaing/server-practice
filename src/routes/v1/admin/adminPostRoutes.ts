import express from "express";
import uploadMemory from "@/middlewares/uploadMemory";
import {
  createPostValidator,
  deletePostValidator,
  updatePostValidator,
} from "@/validators/postValidators";
import { validationRequest } from "@/middlewares/validationRequest";
import {
  createPost,
  deletePost,
  updatePost,
} from "@/controller/admin/postController";
import uploadFile from "@/middlewares/uploadFile";

const router = express.Router();

router.post(
  "/create-post",
  uploadFile.array("images", 4),
  createPostValidator,
  validationRequest,
  createPost
);

router.patch(
  "/update-post",
  uploadMemory.array("images"),
  updatePostValidator,
  validationRequest,
  updatePost
);

router.delete(
  "/delete-post",
  deletePostValidator,
  validationRequest,
  deletePost
);

export default router;
