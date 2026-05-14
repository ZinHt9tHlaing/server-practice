import express from "express";
import { changeLanguage } from "@/controller/api/userController";
import { changeLanguageValidator } from "@/validators/userValidators";
import { validationRequest } from "@/middlewares/validationRequest";

const router = express.Router();

router.post(
  "/change-language",
  changeLanguageValidator,
  validationRequest,
  changeLanguage
);

export default router;
