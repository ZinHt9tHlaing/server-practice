import express from "express";

// routes imports
import authRoute from "./authRoute";

const router = express.Router();

router.use("/api/user", authRoute);

export default router;
