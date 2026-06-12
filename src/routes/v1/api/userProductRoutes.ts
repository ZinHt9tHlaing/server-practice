import express from "express";

import { authMiddleware } from "@/middlewares/authMiddleware";
import {
  getProduct,
  getProductsByPagination,
} from "@/controller/api/productController";
import {
  getProductValidator,
  getProductsByPaginationValidator,
} from "@/validators/productValidator";
import { validationRequest } from "@/middlewares/validationRequest";

const router = express.Router();

router.get(
  "/product/:id",
  authMiddleware,
  getProductValidator,
  validationRequest,
  getProduct
);

router.get(
  "/infinite/products",
  authMiddleware,
  getProductsByPaginationValidator,
  validationRequest,
  getProductsByPagination
);

export default router;
