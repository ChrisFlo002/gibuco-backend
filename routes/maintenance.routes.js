import express from "express";
import {
  createMaintenance,
  getMaintenancesByBus,
  modifyMaintenanceStatus,
} from "../controllers/maintenance.controller.js";

const router = express.Router();

// Create a new maintenance
// POST /api/maintenances
router.post("/", createMaintenance);

// Get maintenances by bus ID with optional filtering and pagination
// GET /api/maintenances/bus/:busId?page=1&limit=10&isDone=true
router.get("/bus/:busId", getMaintenancesByBus);

// Modify maintenance status
// PATCH /api/maintenances/:id/status
router.put("/:id/status", modifyMaintenanceStatus);

export default router;
