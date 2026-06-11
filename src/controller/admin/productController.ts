import generateCloudinaryPath from "@/config/cloudinary/generateCloudinaryPath";
import CacheQueue from "@/jobs/queues/cacheQueue";
import ImageQueue from "@/jobs/queues/imageQueue";
import {
  ProductArgs,
  createOneProduct,
  deleteOneProduct,
  getProductById,
  updateOneProduct,
} from "@/services/productServices";
import { CustomRequest } from "@/types/custom-type";
import { checkModelIfExist, checkUploadFile } from "@/utils/check";
import { NextFunction, Response } from "express";
import { removeFiles } from "./postController";
import { createError } from "@/utils/error";
import { errorCode } from "@/config/errorCode";
import { deleteImage } from "@/config/cloudinary/deleteImage";

export const createProduct = async (req: CustomRequest, res: Response) => {
  const {
    name,
    description,
    price,
    discount,
    inventory,
    category,
    type,
    tags,
  } = req.body;
  const files = req.files as Express.Multer.File[];

  checkUploadFile(files && files.length > 0 ? files : undefined);

  const folderName = "eShop.com/product";

  const uploadImgPromises = files.map(async (file) => {
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Generate cloudinary path
    const { publicId, imageUrl } = generateCloudinaryPath({
      folderName,
      fileName: uniqueFileName,
    });

    await ImageQueue.add("optimize-product-image", {
      source: file.buffer
        ? { type: "buffer", data: file.buffer.toString("base64") }
        : { type: "file", path: file.path },
      width: 835,
      height: 577,
      quality: 100,
      fileName: uniqueFileName,
      folderName,
    });

    return { imageUrl, publicId };
  });

  const uploadedImages = await Promise.all(uploadImgPromises);

  const data = {
    name,
    description,
    price: +price, // string to number
    discount: Number(discount),
    inventory: Number(inventory),
    category,
    type,
    tags,
    images: uploadedImages,
  };

  const product = await createOneProduct(data);

  // Add job to invalidate cache
  await CacheQueue.add(
    "invalidate-product-cache",
    {
      pattern: "products:*",
    },
    {
      jobId: `invalidate-${Date.now()}`,
      priority: 1,
    }
  );

  res.status(201).json({
    message: "Successfully created a new product.",
    productId: product.id,
  });
};

export const updateProduct = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const {
    productId,
    name,
    description,
    price,
    discount,
    inventory,
    category,
    type,
    tags,
  } = req.body;
  const files = req.files as Express.Multer.File[];

  const product = await getProductById(productId);
  if (!product) {
    return next(
      createError("This data model does not exist.", 409, errorCode.invalid)
    );
  }

  checkUploadFile(files && files.length > 0 ? files : undefined);

  const data: ProductArgs = {
    name,
    description,
    price: +price,
    discount: Number(discount),
    inventory: Number(inventory),
    category,
    type,
    tags,
  };

  if (files) {
    const folderName = "eShop.com/product";

    const oldImagePublicIds =
      product.images && product.images.length > 0
        ? product.images.map((img) => img.publicId)
        : undefined;

    const uploadImgPromises = files.map(async (file) => {
      const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const { imageUrl, publicId } = generateCloudinaryPath({
        folderName,
        fileName: uniqueFileName,
      });

      await ImageQueue.add("optimize-product-image", {
        source: file.buffer
          ? { type: "buffer", data: file.buffer.toString("base64") }
          : { type: "file", path: file.path },
        width: 835,
        height: 577,
        quality: 100,
        fileName: uniqueFileName,
        folderName,
        oldPublicIds: file ? oldImagePublicIds : undefined,
      });

      return { imageUrl, publicId };
    });

    data.images = await Promise.all(uploadImgPromises);
  }

  const updatedProduct = await updateOneProduct(productId, data);

  await CacheQueue.add(
    "invalidate-product-cache",
    {
      pattern: "products:*",
    },
    {
      jobId: `invalidate-${Date.now()}`,
      priority: 1,
    }
  );

  res.status(200).json({
    message: "Successfully updated the product.",
    productId: updatedProduct.id,
  });
};

export const deleteProduct = async (req: CustomRequest, res: Response) => {
  const { productId } = req.body;

  const product = await getProductById(productId);
  checkModelIfExist(product);

  if (product!.images && product!.images.length > 0) {
    await Promise.all(
      product!.images.map(async (img) => {
        await deleteImage(img.publicId)
          .then(() => {
            console.log("Successfully deleted the image.");
          })
          .catch((err) => {
            console.error("Failed to delete image!", err);
          });
      })
    );
  }

  const deletedProduct = await deleteOneProduct(productId);

  await CacheQueue.add(
    "invalidate-product-cache",
    {
      pattern: "products:*",
    },
    {
      jobId: `invalidate-${Date.now()}`,
      priority: 1,
    }
  );

  res.status(200).json({
    message: "Successfully deleted the product.",
    productId: deletedProduct.id,
  });
};
