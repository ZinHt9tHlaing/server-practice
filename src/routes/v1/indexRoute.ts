import express from "express";

// routes imports
import authRoute from "./auth/authRoute";
import userRoute from "./admin/userRoutes";

// view routes
import viewRoutes from "./web/viewRoute";

const router = express.Router();

router.use("/api/v1", authRoute);
router.use("/api/v1/admin", userRoute);

// view routes
router.use(viewRoutes);

// error view routes
// app.use(errorController.notFound);

export default router;
