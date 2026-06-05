import express from "express";
import { authMiddleware } from "@/middlewares/authMiddleware";
import {
  getInfinitePostsByPagination,
  getPost,
  getPostsByPagination,
} from "@/controller/api/postController";
import { validationRequest } from "@/middlewares/validationRequest";
import {
  getPostValidator,
  getPostsByPaginationValidator,
} from "@/validators/postValidators";

const router = express.Router();

router.get(
  "/post/:id",
  getPostValidator,
  validationRequest,
  authMiddleware,
  getPost
);
router.get(
  "/posts",
  getPostsByPaginationValidator,
  validationRequest,
  authMiddleware,
  getPostsByPagination
); // Offset Pagination
router.get(
  "/posts/infinite",
  getPostsByPaginationValidator,
  validationRequest,
  authMiddleware,
  getInfinitePostsByPagination
); // Cursor-based Pagination

export default router;
