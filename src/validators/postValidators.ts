import { body, param, query } from "express-validator";
import sanitizeHtml from "sanitize-html";

export const createPostValidator = [
  body("title", "Title is required.").trim().notEmpty().escape(), // remove special characters for XSS attack (eg: "<script>alert('XSS')</script>")
  body("content", "Content is required.").trim().notEmpty().escape(),
  body("body", "Body is required.")
    .trim()
    .notEmpty()
    .customSanitizer((value: string) => sanitizeHtml(value))
    .notEmpty(),
  body("category", "Category is required.").trim().notEmpty().escape(),
  body("type", "Type is required.").trim().notEmpty().escape(),
  body("tags", "Tag is invalid.")
    .optional({ nullable: true })
    .customSanitizer((value: string) => {
      if (value) {
        // split value with comma eg: " tag1 , tag2, tag3 " => ["tag1","tag2","tag3", ""]
        // trim spaces eg: [" tag1 ", " tag2 ", " tag3 "] => ["tag1", "tag2", "tag3"]
        // filter out empty strings eg: ["tag1", "tag2", "tag3", ""] => ["tag1", "tag2", "tag3"]
        return value
          .split(",")
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag !== "");
      } // string to array
      return value;
    }),
];

export const updatePostValidator = [
  body("postId", "Post Id is required.").trim().notEmpty(),
  body("title", "Title is required.").trim().notEmpty().escape(), // remove special characters for XSS attack
  body("content", "Content is required.").trim().notEmpty().escape(),
  body("body", "Body is required.")
    .trim()
    .notEmpty()
    .customSanitizer((value: string) => sanitizeHtml(value))
    .notEmpty(),
  body("category", "Category is required.").trim().notEmpty().escape(),
  body("type", "Type is required.").trim().notEmpty().escape(),
  body("tags", "Tag is invalid.")
    .optional({ nullable: true })
    .customSanitizer((value: string) => {
      if (value) {
        // remove empty tag; eg: " ", " " , "tag3" => ["tag3"]
        // and trim extra spaces
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      } // string to array
      return value;
    }),
];

export const deletePostValidator = [
  body("postId", "Post Id is required.").trim().notEmpty(),
];

export const getPostValidator = [
  param("id", "Post Id is required.").trim().notEmpty(),
];

export const getPostsByPaginationValidator = [
  query("page", "Page number must be unsigned integer.")
    .isInt({ gt: 0 }) // At least 1, greater than 0
    .optional(),
  query("limit", "Limit number must be greater than 4.")
    .isInt({ gt: 4 }) // At least 5, greater than 4
    .optional(),
];

export const getInfinitePostsByPaginationValidator = [
  query("cursor", "Cursor must be Post ID.").isInt({ gt: 0 }).optional(),
  query("limit", "Limit number must be unsigned integer")
    .isInt({ gt: 2 }) // starts and shows from page 3
    .optional(),
];
