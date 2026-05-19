import express from "express";
import {
  changeLanguage,
  uploadProfile,
  uploadProfileMultiple,
} from "@/controller/api/userController";
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
router.patch(
  "/profile/upload/multiple",
  authMiddleware,
  uploadFile.array("avatar"),
  uploadProfileMultiple
);

// router.get("/profile/my-photo", getMyPhoto); // Just for testing

export default router;
