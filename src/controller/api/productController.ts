import type { Response } from "express";
import { CustomRequest } from "@/types/custom-type";

import { getUserById } from "@/services/authServices";
import { checkUserIfNotExist } from "@/utils/auth";
import { getOrSetCache } from "@/utils/cache";
import {
  getProductWithRelations,
  getProductsList,
} from "@/services/productServices";
import { checkModelIfNotExist } from "@/utils/check";
import { Prisma } from "../../../generated/prisma/client";

export const getProduct = async (req: CustomRequest, res: Response) => {
  const productId = req.params.id as string;
  const userId = req.userId as string;
  const user = await getUserById(userId);
  checkUserIfNotExist(user);

  // Add cache to optimize the performance
  const cacheKey = `products:${JSON.stringify(productId)}`;
  const product = await getOrSetCache(cacheKey, async () => {
    return await getProductWithRelations(productId);
  });

  checkModelIfNotExist(product);

  res.status(200).json({ message: "Product Details", product });
};

export const getProductsByPagination = async (
  req: CustomRequest,
  res: Response
) => {
  const lastCursor = req.query.cursor as string;
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const category = req.query.category as string;
  const type = req.query.type as string;

  const userId = req.userId as string;
  const user = await getUserById(userId);
  checkUserIfNotExist(user);

  let categoryList: string[] = [];
  let typeList: string[] = [];

  // Build the filters dynamically
  const whereClause: Prisma.ProductWhereInput = {};

  // Treating it as a String
  if (category) {
    categoryList = category
      .toString()
      .split(",")
      .map((cat) => cat.trim()) // Keep as string
      // Special chars တွေနဲ့ အရှည်မပြည့်တဲ့ ID တွေကို ဖယ်ထုတ်မယ်
      // eg - CUID အရှည်က အနည်းဆုံး ၂၄ လုံး ရှိရမယ်ဆိုရင် length > 24 လို့စစ်နိုင်ပါတယ်
      .filter((cat) => cat.length > 0 && /^[a-z0-9]+$/i.test(cat));

    if (categoryList.length > 0) {
      whereClause.categoryId = { in: categoryList };
    }
  }

  if (type) {
    typeList = type
      .toString()
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && /^[a-z0-9]+$/i.test(t));

    if (typeList.length > 0) {
      whereClause.typeId = { in: typeList };
    }
  }

  const options = {
    take: limit + 1,
    skip: lastCursor ? 1 : 0,
    cursor: lastCursor ? { id: lastCursor } : undefined,
    where: whereClause,
    select: {
      id: true,
      name: true,
      price: true,
      discount: true,
      status: true,
      images: {
        select: {
          id: true,
          imageUrl: true,
          publicId: true,
        },
        take: 1, // limit to the first image
      },
    },
    orderBy: {
      id: Prisma.SortOrder.desc,
    },
  };

  // const cacheKey = `products:${JSON.stringify(req.query)}`;
  // const products = await getOrSetCache(cacheKey, async () => {
  //   return await getProductsList(options);
  // });

  const products = await getProductsList(options);

  const hasNextPage = products.length > limit;

  if (hasNextPage) {
    products.pop();
  }

  const nextCursor =
    products.length > 0 ? products[products.length - 1].id : null;

  res.status(200).json({
    message: "Get All infinite products",
    hasNextPage,
    nextCursor,
    prevCursor: lastCursor,
    products,
  });
};
