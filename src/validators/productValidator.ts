import { body, param } from "express-validator";
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
