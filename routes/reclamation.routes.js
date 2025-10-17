import express from "express";
import {
  createReclamation,
  modifyStatut,
  getReclamations,
  getReclamationById,
  getReclamationByClient,
  getReclamationStats,
} from "../controllers/reclamation.controller.js";

const router = express.Router();

// Create a new reclamation
router.post("/", createReclamation);

// Get all reclamations with pagination and filtering
router.get("/", getReclamations);

// Get reclamation statistics (should be before /:id to avoid conflict)
router.get("/stats", getReclamationStats);

// Get reclamation by ID
router.get("/:id", getReclamationById);

// Get reclamations by client ID
router.get("/client/:clientId", getReclamationByClient);

// Update reclamation status
router.put("/status/:id", modifyStatut);

export default router;
