import express from "express";
import {
  createAdmin,
  getAdmins,
  getAdminById,
  deleteAdmin,
} from "../controllers/admin.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Admin only routes
router.use(admin); // All routes below require Admin role

// Get all admins
router.get("/", getAdmins);

// Get specific admin by ID
router.get("/:id", getAdminById);

// Create new admin (Super Admin functionality - you might want to add additional authorization)
router.post("/", createAdmin);

// Delete admin (Super Admin functionality - you might want to add additional authorization)
router.delete("/:id", deleteAdmin);

export default router;
