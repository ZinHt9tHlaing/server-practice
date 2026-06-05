import type { Response, NextFunction } from "express";
import { CustomRequest } from "@/types/custom-type";
import { getPostWithRelations, getPostsLists } from "@/services/postServices";
import { createError } from "@/utils/error";
import { errorCode } from "@/config/errorCode";
import { getUserById } from "@/services/authServices";
import { checkUserIfNotExist } from "@/utils/auth";
import { Prisma } from "../../../generated/prisma/client";

export const getPost = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId as string;
  const id = req.params.id as string;

  const user = await getUserById(userId);
  checkUserIfNotExist(user);

  const post = await getPostWithRelations(id);
  if (!post) {
    return next(createError("Post not found!", 404, errorCode.invalid));
  }

  // Remove author property from post and create new object with author fullName
  const { author, ...restPost } = post;

  // const response = {
  //   ...restPost,
  //   fullName: `${author.firstName} ${author.lastName}`,
  //   updatedAt: post.updatedAt.toLocaleDateString("en-US", {
  //     year: "numeric",
  //     month: "long",
  //     day: "numeric",
  //   }),
  //   category: post.category.name,
  //   type: post.type.name,
  //   tags: post.tags?.map((tag) => tag.name) ?? null,
  // };

  const response = {
    ...restPost,
    fullName: author.fullName,
    category: restPost.category.name,
    type: restPost.type.name,
    tags: restPost.tags?.map((tag) => tag.name) ?? null,
  };

  res.status(200).json({ message: "Post Details", post: response });
};

// Offset Pagination
export const getPostsByPagination = async (
  req: CustomRequest,
  res: Response
) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? +req.query.limit : 5;

  const userId = req.userId as string;
  const user = await getUserById(userId);
  checkUserIfNotExist(user);

  // pagination skip formula
  const skip = (page - 1) * limit;
  // ( 1 - 1 ) * 5 => page 1မှာ 0ကို skipပီး 1 ကနေ စယူ
  // ( 2 - 1 ) * 5 => page 2မှာ 1 - 5ကို skipပီး 6 ကနေ စယူ
  // ( 3 - 1 ) * 5 => page 3မှာ 6 - 10ကို skipပီး 11 ကနေ စယူ
  // ( 4 - 1 ) * 5 => page 4မှာ 11 - 15ကို skipပီး 16 ကနေ စယူ

  // take 6ခုယူလိုက်ပေမယ့် clientကိုပေးရင်တော့ 5 ခုပဲချပေးမှာ
  // next pageကိုသိချင်လို့ limit ကို 1တိုးပြီးယူတာ
  const options = {
    skip,
    take: limit + 1,
    select: {
      id: true,
      title: true,
      content: true,
      images: true,
      updatedAt: true,
      author: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: {
      // updatedAt: "desc" as const, // Typescript Error Prevent
      updatedAt: Prisma.SortOrder.desc, // Prisma recommended way
    },
  };

  const posts = await getPostsLists(options);

  // တောင်းတာက 5ခုပဲ တစ်ခုပိုယူတော့ 6ခုဖြစ်နေမယ်ဆိုရင်, 6ခုက တောင်းထားတဲ့5ခုထက်များနေတယ်ဆိုရင် NextPageရှိတယ်လို့ဆိုလို
  // 4 > 5 ==> next page မရှိ
  // 5 > 5 ==> next page မရှိ
  // 6 > 5 ==> next page ရှိ
  // paginationလုပ်ဖို့အတွက် နောက်ထပ်pageရှိသေးလားဆိုတာကို သိနိုင်တယ်
  const hasNextPage = posts.length > limit; // boolean
  let nextPage = null;

  if (hasNextPage) {
    // hasNextPageရှိရင် 6ခုမြောက်ကိုဖျက်ထုတ်(removeပစ်)၊ then clientကို 5ခုပဲပြန်ပို့
    posts.pop(); // remove 6th item (last item)
    nextPage = page + 1; // လက်ရှိpageက 1ဆိုရင် nextPageက 2လို့ပြမယ်
  }

  // page က 1 မဟုတ်မှသာ previous page ကိုပြမယ်၊ page 1 ဆိုရင် null ပေါ့
  const previousPage = page !== 1 ? page - 1 : null;

  res.status(200).json({
    message: "Get All Posts",
    hasNextPage,
    nextPage,
    previousPage,
    posts,
  });
};

// Cursor-based Pagination
export const getInfinitePostsByPagination = async (
  req: CustomRequest,
  res: Response
) => {
  const lastCursor = req.query.cursor as string;
  const limit = req.query.limit ? Number(req.query.limit) : 5;

  const userId = req.userId as string;
  const user = await getUserById(userId);
  checkUserIfNotExist(user);

  const options = {
    take: limit + 1,
    skip: lastCursor ? 1 : 0, // Cursor ကိုယ်တိုင် ပြန်ပါမလာအောင် ၁ ခု ကျော်လိုက်ပါတယ်
    cursor: lastCursor ? { id: lastCursor } : undefined, // lastCursor က 101 ဆိုရင် 101ကို ကျော်ပီး 102ကစယူ
    select: {
      id: true,
      title: true,
      content: true,
      images: true,
      updatedAt: true,
      author: {
        select: {
          fullName: true,
        },
      },
    },
    orderBy: {
      // updatedAt: "asc" as const, // Typescript Error Prevent
      updatedAt: Prisma.SortOrder.asc, // Prisma recommended way
    },
  };

  const posts = await getPostsLists(options);

  const hasNextPage = posts.length > limit;

  if (hasNextPage) {
    posts.pop(); // ပိုနေတဲ့ ၁ ခုကို ဖယ်ထုတ်ပါတယ်
  }

  // နောက်တစ်ခါ ခေါ်ဖို့အတွက် လက်ရှိ Result ရဲ့ နောက်ဆုံး ID ကို Cursor အဖြစ် ယူပါတယ်
  const nextCursor =
    posts.length > 0
      ? posts[posts.length - 1].id // နောက်ဆုံး dataကိုယူ
      : null;

  res.status(200).json({
    message: "Get All infinite posts",
    hasNextPage,
    nextCursor,
    prevCursor: lastCursor,
    posts,
  });
};
