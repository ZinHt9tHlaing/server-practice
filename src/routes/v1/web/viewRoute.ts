import { aboutView, homeView } from "@/controller/web/viewController";
import express from "express";

const router = express.Router();

router.get("/home", homeView);

router.get("/about", aboutView);

export default router;
