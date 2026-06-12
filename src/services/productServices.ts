import { prisma } from "@/lib/prisma";
import { Status } from "../../generated/prisma/enums";
import { Prisma } from "../../generated/prisma/client";

type ImageInput = {
  imageUrl: string;
  publicId: string;
};

export type ProductArgs = {
  name: string;
  description: string;
  price: number;
  discount: number;
  rating?: number;
  inventory: number;
  status?: Status;
  category: string;
  type: string;
  tags: string[];
  orders?: number;
  images?: ImageInput[];
};

export const createOneProduct = async (data: ProductArgs) => {
  const productsData = {
    name: data.name,
    description: data.description,
    price: data.price,
    discount: data.price,
    rating: data.rating,
    inventory: data.inventory,
    category: {
      connectOrCreate: {
        where: { name: data.category },
        create: { name: data.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: data.type },
        create: { name: data.type },
      },
    },

    tags:
      Array.isArray(data.tags) && data.tags.length > 0
        ? {
            connectOrCreate: data.tags.map((tagName) => ({
              where: { name: tagName },
              create: { name: tagName },
            })),
          }
        : undefined,

    images:
      Array.isArray(data.images) && data.images.length > 0
        ? {
            create: data.images.map((img) => ({
              imageUrl: img.imageUrl,
              publicId: img.publicId,
            })),
          }
        : undefined,
  };

  return prisma.product.create({ data: productsData });
};

export const getProductById = async (productId: string) => {
  return prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      images: true,
    },
  });
};

export const updateOneProduct = async (
  productId: string,
  data: ProductArgs
) => {
  const productData = {
    name: data.name,
    description: data.description,
    price: data.price,
    discount: data.discount,
    inventory: data.inventory,
    category: {
      connectOrCreate: {
        where: { name: data.category },
        create: { name: data.category },
      },
    },
    type: {
      connectOrCreate: {
        where: { name: data.type },
        create: { name: data.type },
      },
    },
    images:
      data.images && data.images.length > 0
        ? {
            deleteMany: {},
            create: data.images.map((img) => ({
              imageUrl: img.imageUrl,
              publicId: img.publicId,
            })),
          }
        : undefined,

    tags:
      data.tags && data.tags.length > 0
        ? {
            set: [],
            connectOrCreate: data.tags.map((tag) => ({
              where: { name: tag },
              create: { name: tag },
            })),
          }
        : undefined,
  };

  return prisma.product.update({
    where: {
      id: productId,
    },
    data: productData,
  });
};

export const deleteOneProduct = async (productId: string) => {
  return prisma.product.delete({
    where: {
      id: productId,
    },
  });
};

export const getProductWithRelations = async (id: string) => {
  return prisma.product.findUnique({
    where: { id },
    omit: {
      categoryId: true,
      typeId: true,
      createdAt: true,
      updatedAt: true,
    },
    include: {
      images: {
        select: {
          id: true, // for looping key in react
          imageUrl: true,
          publicId: true,
        },
      },
    },
  });
};

// Using Generics for type safety
export const getProductsList = async <T extends Prisma.ProductFindManyArgs>(
  options?: T
) => {
  return prisma.product.findMany(options);
};
