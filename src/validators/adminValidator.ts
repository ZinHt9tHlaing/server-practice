import { body } from "express-validator";

export const setMaintenanceValidator = [
  body("mode", "Mode must be boolean.").notEmpty().isBoolean(),
];
