import express from "express";
import {
  createReservation,
  modifyStatut,
  modifyReservation,
  getReservations,
  getReservationById,
  getReservationByClient,
  getTodayReservation,
} from "../controllers/reservation.controller.js";

const router = express.Router();

// Create a new reservation
router.post("/", createReservation);

// Get all reservations with pagination and filtering
router.get("/", getReservations);

// Get today's reservations
router.get("/today", getTodayReservation);

// Get reservation by ID
router.get("/:id", getReservationById);

// Get reservations by client ID
router.get("/client/:clientId", getReservationByClient);

// Update reservation status
router.put("/:id/status", modifyStatut);

// Update reservation details
router.put("/:id", modifyReservation);

export default router;
