import express from "express";

// routes imports
import authRoute from "./authRoute";
import viewRoutes from "./web/viewRoute";

const router = express.Router();

router.use("/api/user", authRoute);

// view routes
router.use(viewRoutes);

export default router;
