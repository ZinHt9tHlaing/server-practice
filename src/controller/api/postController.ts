import type { Response } from "express";
import { CustomRequest } from "@/types/custom-type";

export const getPost = async (req: CustomRequest, res: Response) => {};

export const getPostsByPagination = async (
  req: CustomRequest,
  res: Response
) => {};

export const getInfinitePostsByPagination = async (
  req: CustomRequest,
  res: Response
) => {};
