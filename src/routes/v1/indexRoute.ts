import express from "express";

// routes imports
import authRoute from "./auth/authRoute";
// admin routes
import adminUserRoute from "./admin/userRoutes";
import adminPostRoutes from "./admin/adminPostRoutes";

// api routes
import userApiRoute from "./api/userRoutes";
import userPostRoutes from "./api/userPostRoutes";

// view routes
import viewRoutes from "./web/viewRoute";
import { authMiddleware } from "@/middlewares/authMiddleware";
import { authorize } from "@/middlewares/authorizeMiddleware";

const router = express.Router();

// router.use("/api/v1", maintenance, authRoute);
// router.use(
//   "/api/v1/admin",
//   maintenance,
//   authMiddleware,
//   authorize(true, "ADMIN"),
//   adminUserRoute
// );
// router.use("/api/v1/user", maintenance, userApiRoute);

// no need maintenance middleware
router.use("/api/v1", authRoute);

// admin
router.use(
  "/api/v1/admin",
  authMiddleware,
  authorize(true, "ADMIN"),
  adminUserRoute, // admin user routes
  adminPostRoutes // admin post routes
);

// user
router.use("/api/v1/user", userApiRoute, userPostRoutes);

// view routes
router.use(viewRoutes);

// error view routes
// app.use(errorController.notFound);

export default router;
