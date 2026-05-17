import express from "express";
import { changeLanguage } from "@/controller/api/userController";
import { changeLanguageValidator } from "@/validators/userValidators";
import { validationRequest } from "@/middlewares/validationRequest";
import { textPermission } from "@/controller/admin/userController";
import { authMiddleware } from "@/middlewares/authMiddleware";

const router = express.Router();

router.post(
  "/change-language",
  changeLanguageValidator,
  validationRequest,
  changeLanguage
);

router.get("/test-permission", authMiddleware, textPermission);

export default router;
