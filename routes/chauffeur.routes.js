import express from "express";
import {
  createChauffeur,
  getChauffeur,
  getChauffeurs,
  getChauffeurByUserId,
  updateChauffeurLicence,
  getChauffeurByLicence,
} from "../controllers/chauffeur.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get chauffeur by licence number (should be before /:id to avoid conflicts)
router.get("/licence/:licenceNumber", getChauffeurByLicence);

// Get all chauffeurs (with optional filtering)
router.get("/", getChauffeurs);

// Get specific chauffeur by ID
router.get("/:id", getChauffeur);
//get chauffeur by userId
router.get("/user/:userId", getChauffeurByUserId);

// Admin/Agent only routes
router.post("/", protect, admin, createChauffeur);
router.put("/:id/licence", protect, admin, updateChauffeurLicence);

export default router;
