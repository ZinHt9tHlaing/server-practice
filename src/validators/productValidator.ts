import { body, param, query } from "express-validator";
import sanitizeHtml from "sanitize-html";

export const createProductValidator = [
  body("name", "Name is required.").trim().notEmpty().escape(),
  body("description", "Description is required.")
    .trim()
    .notEmpty()
    .escape()
    .customSanitizer((value: string) => sanitizeHtml(value)),
  body("price", "Price is required.")
    .isFloat({ min: 0.1 })
    .isDecimal({ decimal_digits: "1,2" }), // ဒဿမ ၂နေရာပဲလက်ခံမယ် eg: 0.12
  body("discount", "Discount is required.")
    .isFloat({ min: 0 }) // minus don't allow
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "Inventory is required.").isInt({ min: 1 }),
  body("category", "Category is required.").trim().notEmpty().escape(),
  body("type", "Type is required.").trim().notEmpty().escape(),
  body("tags", "Tag is invalid.")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        // split value with comma
        // Remove whitespace from each tag and Remove empty tags
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      } // string to array
      return value;
    }),
];

export const updateProductValidator = [
  body("productId", "Product Id is required.").trim().notEmpty(),
  body("name", "Name is required.").trim().notEmpty().escape(),
  body("description", "Description is required.")
    .trim()
    .notEmpty()
    .escape()
    .customSanitizer((value: string) => sanitizeHtml(value)),
  body("price", "Price is required.")
    .isFloat({ min: 0.1 })
    .isDecimal({ decimal_digits: "1,2" }), // ဒဿမ ၂နေရာပဲလက်ခံမယ် eg: 0.12
  body("discount", "Discount is required.")
    .isFloat({ min: 0 }) // minus don't allow
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "Inventory is required.").isInt({ min: 1 }),
  body("category", "Category is required.").trim().notEmpty().escape(),
  body("type", "Type is required.").trim().notEmpty().escape(),
  body("tags", "Tag is invalid.")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        // split value with comma
        // Remove whitespace from each tag and Remove empty tags
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      } // string to array
      return value;
    }),
];

export const getProductValidator = [
  param("id", "Product Id is required.").trim().notEmpty(),
];

export const deleteProductValidator = [
  body("productId", "Product Id is required").trim().notEmpty(),
];

export const getProductsByPaginationValidator = [
  query("cursor", "Cursor must be Product ID.").isInt({ gt: 0 }).optional(),
  query("limit", "Limit number must be unsigned integer")
    .isInt({ gt: 4 }) // starts and shows from page 5
    .optional(),
  query("category", "Category is invalid.").optional().trim(),
  // .custom((value) => {
  //   const parts = value.split(",");
  //   for (const part of parts) {
  //     const trimmed = part.trim();
  //     if (trimmed === "") {
  //       continue;
  //     } // skip white space

        // CUID Format check (must be string and number, Special Characters not allow)
        // if CUID length is 25, then use /^[a-z0-9]{25}$/i
  //     if (!/^[a-z0-9]+$/i.test(trimmed)) {
  //       throw new Error(`Invalid category ID format found: ${trimmed}`);
  //     }
  //   }
  //   return true;
  // })
  query("type", "Type is invalid.").optional().trim(),
  // .custom((value) => {
  //   const parts = value.split(",");
  //   for (const part of parts) {
  //     const trimmed = part.trim();
  //     if (trimmed === "") {
  //       continue;
  //     }

  //     if (!/^[a-z0-9]+$/i.test(trimmed)) {
  //       throw new Error(`Invalid type ID format found: ${trimmed}`);
  //     }
  //   }
  //   return true;
  // }),
];
