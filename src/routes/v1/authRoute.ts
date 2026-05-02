import { login } from "@/controller/authController";
import express from "express";

const authRoute = express.Router();

authRoute.post("/login", login);

export default authRoute;
