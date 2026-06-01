import express from "express";
import { authMiddleware } from "@/middlewares/authMiddleware";
import {
  getInfinitePostsByPagination,
  getPost,
  getPostsByPagination,
} from "@/controller/api/postController";

const router = express.Router();

router.get("/post/:id", authMiddleware, getPost);
router.get("/posts", authMiddleware, getPostsByPagination); // Offset Pagination
router.get("/posts/infinite", authMiddleware, getInfinitePostsByPagination); // Cursor-based Pagination

export default router;
