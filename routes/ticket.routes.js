import express from "express";
import {
  createTicket,
  getTicketById,
  getTicketByReservation,
  updateTicketSeats,
} from "../controllers/ticket.controller.js";

const router = express.Router();

// Create a new ticket
router.post("/", createTicket);

// Get ticket by ID
router.get("/:id", getTicketById);

// Get ticket by reservation ID
router.get("/reservation/:reservationId", getTicketByReservation);

// Update ticket seat numbers
router.patch("/:id/seats", updateTicketSeats);

export default router;
