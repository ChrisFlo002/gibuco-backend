import express from "express";
import {
  createBus,
  modifyStatut,
  getBus,
  getBusById,
  getBusByChauffeur,
} from "../controllers/bus.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// Create a new bus
// POST /api/buses
router.post("/", createBus);

// Get all buses with optional filtering and pagination
// GET /api/buses?page=1&limit=10&statut=disponible
router.get("/", protect, getBus);

// Get a specific bus by ID
// GET /api/buses/:id
router.get("/:id", getBusById);

// Modify bus status
// PATCH /api/buses/:id/status
router.put("/:id/status", modifyStatut);

// Get bus by ID with chauffeur info
// GET /api/buses/:id/chauffeur
router.get("/chauffeur/:chauffeur", protect, getBusByChauffeur);
export default router;
