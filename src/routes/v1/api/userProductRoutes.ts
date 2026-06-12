import express from "express";

import { authMiddleware } from "@/middlewares/authMiddleware";
import {
  checkInventory,
  getProduct,
  getProductsByPagination,
  searchProducts,
} from "@/controller/api/productController";
import {
  checkInventoryMiddleware,
  getProductValidator,
  getProductsByPaginationValidator,
  searchProductsValidator,
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

router.get(
  "/search/products",
  authMiddleware,
  searchProductsValidator,
  validationRequest,
  searchProducts
);

router.get(
  "/check-inventory/:id",
  authMiddleware,
  checkInventoryMiddleware,
  validationRequest,
  checkInventory
);

export default router;
