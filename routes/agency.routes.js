import express from "express";
import {
  createAgency,
  getAgencies,
  getAgencyById,
  updateAgency,
  deleteAgency,
} from "../controllers/agency.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Get all agencies (with optional filtering by ville or province)
router.get("/", getAgencies);
// All routes require authentication
router.use(protect);

// Get specific agency by ID
router.get("/:id", getAgencyById);

// Admin only routes
router.post("/", admin, createAgency);
router.put("/:id", admin, updateAgency);
router.delete("/:id", admin, deleteAgency);

export default router;
