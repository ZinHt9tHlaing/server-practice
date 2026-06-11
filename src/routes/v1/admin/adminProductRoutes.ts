import express from "express";

import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/controller/admin/productController";
import uploadMemory from "@/middlewares/uploadMemory";
import { deletePostValidator } from "@/validators/postValidators";
import { validationRequest } from "@/middlewares/validationRequest";
import {
  createProductValidator,
  deleteProductValidator,
  updateProductValidator,
} from "@/validators/productValidator";

const router = express.Router();

router.post(
  "/create-product",
  uploadMemory.array("images", 4),
  createProductValidator,
  validationRequest,
  createProduct
);
router.patch(
  "/update-product",
  uploadMemory.array("images", 4),
  updateProductValidator,
  validationRequest,
  updateProduct
);
router.delete(
  "/delete-product",
  deleteProductValidator,
  validationRequest,
  deleteProduct
);

export default router;
