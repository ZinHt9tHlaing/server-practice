import express from "express";
import { changeLanguage, uploadProfile } from "@/controller/api/userController";
import { changeLanguageValidator } from "@/validators/userValidators";
import { validationRequest } from "@/middlewares/validationRequest";
import { textPermission } from "@/controller/admin/userController";
import { authMiddleware } from "@/middlewares/authMiddleware";
import uploadFile from "@/middlewares/uploadFile";

const router = express.Router();

router.post(
  "/change-language",
  changeLanguageValidator,
  validationRequest,
  changeLanguage
);
router.get("/test-permission", authMiddleware, textPermission);
router.patch(
  "/profile/upload",
  authMiddleware,
  uploadFile.single("avatar"),
  uploadProfile
);

export default router;
