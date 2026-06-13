import express from "express";
import { authMiddleware } from "@/middlewares/authMiddleware";
import {
  getCategoryType,
  getInfinitePostsByPagination,
  getPost,
  getPostsByPagination,
  searchPosts,
} from "@/controller/api/postController";
import { validationRequest } from "@/middlewares/validationRequest";
import {
  getPostValidator,
  getPostsByPaginationValidator,
  searchPostsValidator,
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
router.get(
  "/search/posts",
  authMiddleware,
  searchPostsValidator,
  validationRequest,
  searchPosts
); // search posts

router.get("/filter-type", authMiddleware, getCategoryType);

export default router;
