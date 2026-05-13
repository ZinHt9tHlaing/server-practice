import { getAllUsers } from "@/controller/admin/userController";
import { authMiddleware } from "@/middlewares/authMiddleware";
import express from "express";

const router = express.Router();

router.get("/users", authMiddleware, getAllUsers);

export default router;
