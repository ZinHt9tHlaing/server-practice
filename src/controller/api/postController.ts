import type { Response, NextFunction } from "express";
import { CustomRequest } from "@/types/custom-type";
import {
  getCategoryList,
  getPostWithRelations,
  getPostsLists,
  getTypeList,
} from "@/services/postServices";
import { createError } from "@/utils/error";
import { errorCode } from "@/config/errorCode";
import { getUserById } from "@/services/authServices";
import { checkUserIfNotExist } from "@/utils/auth";
import { Prisma } from "../../../generated/prisma/client";
import { getOrSetCache } from "@/utils/cache";
import { matchedData } from "express-validator";
import { prismaClient } from "@/services/prismaClient";
import { prisma } from "@/lib/prisma";

// Extract the argument types specifically from your extended client
type ExtendedPostFindManyArgs = Parameters<
  typeof prismaClient.post.findMany
>[0];

export const getPost = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId as string;
  const id = req.params.id as string;

  const user = await getUserById(userId);
  checkUserIfNotExist(user);

  // const post = await getPostWithRelations(id);

  const cacheKey = `posts:${JSON.stringify(id)}`;
  const post = await getOrSetCache(cacheKey, async () => {
    return await getPostWithRelations(id);
  });

  if (!post) {
    return next(createError("Post not found!", 404, errorCode.invalid));
  }

  // Increment view count when user viewed post
  await prisma.post
    .update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    })
    .catch((err) => {
      console.error("Failed to increment view count:", err);
    });

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

  // const posts = await getPostsLists(options);

  const cacheKey = `posts:${JSON.stringify(req.query)}`;
  const posts = await getOrSetCache(cacheKey, async () => {
    return await getPostsLists(options);
  });

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

  // အရင်ယူပီးသား post Cursorအဟောင်း ကိုယ်တိုင် ပြန်ပါမလာအောင် ၁ ခု (skip 1) ကျော်လိုက်ပါတယ် (Duplicate မဖြစ်အောင် ကာကွယ်တာ)
  // "ပေးလိုက်တဲ့ lastCursor (Post 5) နေရာကနေ စယူပါ။ ဒါပေမယ့် အဲဒီ Post 5 ကိုတော့ ၁ ခု ကျော် (skip 1) လိုက်ပါ။ သူ့နောက်ကဟာကနေပဲ စယူပါ" လို့ ခိုင်းလိုက်တာ ဖြစ်ပါတယ်။
  // skip: 1 ထည့်လိုက်တဲ့အခါ ထွက်လာမယ့်စာရင်း = [Post 6, Post 7, Post 8, Post 9, Post 10]
  // skip မပါရင် ထွက်လာမယ့်စာရင်း = [Post 5, Post 6, Post 7, Post 8, Post 9] (Post 5 က အရင် Page ကဟာ)
  // Post 5 က Frontend မှာ အရင်ကတည်းက ပြပြီးသား ဖြစ်နေပါတယ်။ အဲဒါကို ထပ်ယူလိုက်ရင် Frontend မှာ Post 5 က နှစ်ခါ ထပ်သွားပီး Duplicate Error တက်နိုင်ပါတယ်။
  const options = {
    take: limit + 1,
    skip: lastCursor ? 1 : 0,
    cursor: lastCursor ? { id: lastCursor } : undefined, // lastCursor က 5 ဆိုရင် 5 ကို ကျော်ပီး 6 ကနေ 10 အထိယူသွားမယ်
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

  // const cacheKey = `posts:${JSON.stringify(req.query)}`;
  // const posts = await getOrSetCache(cacheKey, async () => {
  //   return await getPostsLists(options);
  // });

  const hasNextPage = posts.length > limit;

  if (hasNextPage) {
    posts.pop(); // ပိုနေတဲ့ ၁ ခုကို ဖယ်ထုတ်ပါတယ်
  }

  // nextCursor ဆိုတာ နောက်တစ်ခါ API လာခေါ်ရင် ဘယ်နေရာကနေ ဆက်စပြီး ယူပေးရမလဲ ဆိုတာကို Frontend က သိအောင် ပြန်ပို့ပေးလိုက်တဲ့ ID
  // Frontend (ဥပမာ- React သို့မဟုတ် Mobile App) ဘက်ကနေ User က Screen ကို အောက်ဆုံးထိ Scroll ဆွဲချသွားလို့ နောက်ထပ် Post တွေကို ထပ်လိုချင်တဲ့အခါ (Infinite Scrolling)၊ ဒီ nextCursor အဖြစ် ရလာတဲ့ ID လေးကို Server (API) ဆီ ပြန်ပို့ပေးရပါတယ်။
  // အဲ့ဒီအခါ သင့် Code ထဲက အပေါ်ဆုံးနားမှာရှိတဲ့ const lastCursor = req.query.cursor ဆိုတဲ့ နေရာကနေ အဲ့ဒီ ID ကို လက်ခံရရှိသွားပါလိမ့်မယ်။

  // နောက်တစ်ခါ ခေါ်ဖို့အတွက် လက်ရှိ Result ရဲ့ နောက်ဆုံး ID ကို Cursor အဖြစ် ယူပါတယ်
  // နောက်ထပ် ခေါ်စရာ cursorရှိသေးလား မရှိဘူးလား
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

export const searchPosts = async (req: CustomRequest, res: Response) => {
  const data = matchedData(req);
  const keyword = data.keyword as string;
  const category = data.category as string | undefined;
  const type = data.type as string | undefined;

  const whereClause: Prisma.PostWhereInput = {};

  if (keyword) {
    const cleanKeyword = keyword.toLowerCase().trim(); // Reduce case sensitivity
    // SearchTrend table မှာ keyword ရှိရင် count 1 တိုးမယ်၊ မရှိရင် အသစ်ဖန်တီးမယ် (Upsert)
    await prisma.searchTrend.upsert({
      where: { keyword: cleanKeyword },
      update: { count: { increment: 1 } }, // Search Trend Count 1 တိုးပီး တင်ပေး (Database မှာရှိနေရင် update)
      create: { keyword: cleanKeyword, count: 1 }, // Keyword မရှိသေးရင် ပထမဆုံးအကြိမ် စာရင်းထဲထည့်ပေး (Database မှာမရှိရင် create)
    });

    whereClause.OR = [
      { title: { contains: cleanKeyword, mode: "insensitive" } },
      { content: { contains: cleanKeyword, mode: "insensitive" } },
      {
        tags: {
          some: { name: { contains: cleanKeyword, mode: "insensitive" } },
        },
      },
    ];
  }

  let categoryList: string[] = [];
  let typeList: string[] = [];

  if (category) {
    categoryList = category
      .toString()
      .split(",")
      .map((category) => category.trim())
      .filter((cat) => cat.length > 0 && /^[a-z0-9]+$/i.test(cat));

    if (categoryList.length > 0) {
      whereClause.categoryId = { in: categoryList };
    }
  }

  if (type) {
    typeList = type
      .toString()
      .split(",")
      .map((type) => type.trim())
      .filter((t) => t.length > 0 && /^[a-z0-9]+$/i.test(type));

    if (typeList.length > 0) {
      whereClause.typeId = { in: typeList };
    }
  }

  const options: ExtendedPostFindManyArgs = {
    where: whereClause,
    select: {
      id: true,
      title: true,
      content: true,
      viewCount: true,
      images: {
        select: {
          id: true,
          imageUrl: true,
          publicId: true,
        },
      },
      updatedAt: true,
      author: {
        select: {
          fullName: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
    },
    orderBy: keyword
      ? { id: "desc" } // Search Result
      : { viewCount: "desc" }, // Trending Popular Posts
  };

  const posts = await getPostsLists(options);
  // const cacheKey = `posts:${JSON.stringify(data)}`;
  // const posts = await getOrSetCache(cacheKey, async () => {
  //   return await getPostsLists(options);
  // });

  res.status(200).json({
    message:
      Object.keys(whereClause).length > 0
        ? `Search results for '${keyword}'`
        : "Trending Popular Posts",
    totalCount: posts.length,
    isTrending: !keyword, // if keyword is false, show trending
    posts,
  });
};

export const getCategoryType = async (req: CustomRequest, res: Response) => {
  const userId = req.userId as string;
  const user = await getUserById(userId);
  checkUserIfNotExist(user);

  const [categories, types] = await Promise.all([
    getCategoryList(),
    getTypeList(),
  ]);

  res.status(200).json({
    message: "Get All Categories and Types",
    categories,
    types,
  });
};
