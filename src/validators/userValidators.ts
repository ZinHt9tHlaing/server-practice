import { query } from "express-validator";

export const changeLanguageValidator = [
  query("lng", "Invalid Language code.")
    .trim()
    .notEmpty()
    .matches("^[a-z]+$") // only lowercase letters allowed
    .isLength({ min: 2, max: 3 }),
];
