import express from "express";
import {
  createClient,
  modifyPoints,
  getClients,
  getClientById,
  getClientsWithHighestPoints,
} from "../controllers/client.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get clients with highest points (should be before /:id to avoid conflicts)
router.get("/top-points", getClientsWithHighestPoints);

// Get all clients (with optional filtering)
router.get("/", getClients);

// Get specific client by ID
router.get("/:id", getClientById);

// Admin/Agent only routes
router.post("/", createClient);
router.put("/:id/points", admin, modifyPoints);

export default router;
