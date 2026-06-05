import { prisma } from "@/lib/prisma";

export const prismaClient = prisma.$extends({
  result: {
    // User model
    user: {
      // Add the fullname property when returning the result
      fullName: {
        needs: { firstName: true, lastName: true },
        compute: (user) => {
          return `${user.firstName} ${user.lastName}`;
        },
      },
    },

    // Post model
    post: {
      updatedAt: {
        needs: { updatedAt: true },
        compute: (post) => {
          return post.updatedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        },
      },
    },
  },
});
