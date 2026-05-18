import express from "express";
import { getAllUsers } from "@/controller/admin/userController";
import { setMaintenance } from "@/controller/admin/systemController";
import { setMaintenanceValidator } from "@/validators/adminValidator";
import { validationRequest } from "@/middlewares/validationRequest";

const router = express.Router();

router.get("/users", getAllUsers);
router.post(
  "/maintenance",
  setMaintenanceValidator,
  validationRequest,
  setMaintenance
);

export default router;
