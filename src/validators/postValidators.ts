import { body } from "express-validator";

export const createPostValidator = [
  body("title", "Title is required.").trim().notEmpty().escape(), // remove special characters for XSS attack
  body("content", "Content is required.").trim().notEmpty().escape(),
  body("body", "Body is required.").trim().notEmpty().escape(),
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

export const updatePostValidator = [
  body("postId", "Post Id is required.").isInt({ gt: 0 }),
];

export const deletePostValidator = [
  body("postId", "Post Id is required.").isInt({ gt: 0 }),
];
