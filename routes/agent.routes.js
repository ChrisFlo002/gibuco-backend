import express from "express";
import {
  createAgent,
  getAgent,
  getAgents,
  getAgentByUserId,
  updateAgentByUserId
} from "../controllers/agent.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all agents (with optional filtering by agency)
router.get("/", getAgents);

// Get specific agent by ID
router.get("/:id", getAgent);
//get agent by userId
router.get("/user/:userId", getAgentByUserId);

// Admin only routes
router.post("/",admin, createAgent);
router.put("/user/:userId", admin, updateAgentByUserId);

export default router;