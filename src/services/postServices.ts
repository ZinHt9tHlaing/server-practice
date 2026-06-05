import { prisma } from "@/lib/prisma";
import { prismaClient } from "./prismaClient";

type ImageInput = {
  imageUrl: string;
  publicId: string;
};

export type PostArgs = {
  title: string;
  content: string;
  body: string;
  authorId?: string;
  category: string;
  type: string;
  tags: string[];
  images?: ImageInput[];
};

// Function parameters တွေကို tuple အဖြစ်ထုတ်ပေးတယ်။
// $extends() Prisma Type (fullName, updatedAt စတာတွေ ပါပြီးသား)
type PostFindManyArgs = Parameters<typeof prismaClient.post.findMany>[0];

export const createOnePost = async (postData: PostArgs) => {
  return prisma.post.create({
    data: {
      title: postData.title,
      content: postData.content,
      body: postData.body,
      author: {
        connect: {
          id: postData.authorId,
        },
      },
      category: {
        connectOrCreate: {
          where: { name: postData.category },
          create: { name: postData.category },
        },
      },
      type: {
        connectOrCreate: {
          where: { name: postData.type },
          create: { name: postData.type },
        },
      },
      images:
        postData.images && postData.images.length > 0
          ? {
              create: postData.images?.map((img) => ({
                imageUrl: img.imageUrl,
                publicId: img.publicId,
              })),
            }
          : undefined,
      tags:
        postData.tags && postData.tags.length > 0
          ? {
              connectOrCreate: postData.tags.map((tagName) => ({
                where: { name: tagName },
                create: { name: tagName },
              })),
            }
          : undefined, // if not tags, skip
    },
  });
};

export const getPostById = async (id: string) => {
  return prisma.post.findUnique({
    where: { id },
    include: {
      images: true,
    },
  });
};

export const updateOnePost = async (postId: string, postData: PostArgs) => {
  return prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      title: postData.title,
      content: postData.content,
      body: postData.body,
      category: {
        connectOrCreate: {
          where: { name: postData.category },
          create: {
            name: postData.category,
          },
        },
      },
      type: {
        connectOrCreate: {
          where: { name: postData.type },
          create: {
            name: postData.type,
          },
        },
      },

      images:
        postData.images && postData.images.length > 0
          ? {
              deleteMany: {},
              create: postData.images?.map((img) => ({
                imageUrl: img.imageUrl,
                publicId: img.publicId,
              })),
            }
          : undefined,
      tags:
        postData.tags && postData.tags.length > 0
          ? {
              connectOrCreate: postData.tags.map((tagName) => ({
                where: { name: tagName },
                create: { name: tagName },
              })),
            }
          : undefined, // if not tags, skip
    },
  });
};

export const deleteOnePost = async (postId: string) => {
  return prisma.post.delete({
    where: {
      id: postId,
    },
  });
};

export const getPostWithRelations = async (id: string) => {
  return prismaClient.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      body: true,
      updatedAt: true,
      author: {
        select: {
          firstName: true,
          lastName: true,
          fullName: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
      type: {
        select: {
          name: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
      images: {
        omit: {
          id: true,
        },
      },
    },
  });
};

// for Offset Pagination and Cursor-based Pagination
export const getPostsLists = async (options: PostFindManyArgs) => {
  // Can be changed options according to the Offset and Cursor based Pagination
  return prismaClient.post.findMany(options);
};
