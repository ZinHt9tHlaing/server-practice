import { prisma } from "@/lib/prisma";

type ImageInput = {
  imageUrl: string;
  publicId: string;
};

export type PostArgs = {
  title: string;
  content: string;
  body: string;
  authorId: string;
  category: string;
  type: string;
  tags: string[];
  images: ImageInput[];
};

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
      images: {
        create: postData.images.map((img) => ({
          imageUrl: img.imageUrl,
          publicId: img.publicId,
        })),
      },
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
