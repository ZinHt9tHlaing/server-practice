import express from "express";

// routes imports
import authRoute from "./auth/authRoute";
// admin routes
import adminUserRoute from "./admin/userRoutes"
// api routes
import userApiRoute from "./api/userRoutes";

// view routes
import viewRoutes from "./web/viewRoute";

const router = express.Router();

router.use("/api/v1", authRoute);
router.use("/api/v1/admin", adminUserRoute);
router.use("/api/v1/user", userApiRoute);

// view routes
router.use(viewRoutes);

// error view routes
// app.use(errorController.notFound);

export default router;
