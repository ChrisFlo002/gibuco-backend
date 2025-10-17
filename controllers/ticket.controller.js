import Ticket from "../models/ticket.model.js";
import Reservation from "../models/reservation.model.js";
import mongoose from "mongoose";

// Create a new ticket
export const createTicket = async (req, res) => {
  try {
    const { reservationId, numeroSiege } = req.body;

    // Validate required fields
    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: "L'ID de réservation est requis",
      });
    }

    // Verify that the reservation exists
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée",
      });
    }

    // Check if reservation is confirmed
    if (reservation.statut !== "confirmee") {
      return res.status(400).json({
        success: false,
        message:
          "Le ticket ne peut être créé que pour une réservation confirmée",
      });
    }

    // Check if ticket already exists for this reservation
    const existingTicket = await Ticket.findOne({ reservationId });
    if (existingTicket) {
      return res.status(400).json({
        success: false,
        message: "Un ticket existe déjà pour cette réservation",
      });
    }

    const ticket = new Ticket({
      reservationId,
      numeroSiege: numeroSiege || [],
    });

    await ticket.save();

    // Populate the ticket with reservation details
    const populatedTicket = await Ticket.findById(ticket._id).populate({
      path: "reservationId",
      populate: [
        { path: "clientId", select: "nom prenom email telephone" },
        {
          path: "trajetId",
          select: "depart destination dateDepart heureDepart prix",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Ticket créé avec succès",
      data: populatedTicket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du ticket",
      error: error.message,
    });
  }
};

// Get ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de ticket invalide",
      });
    }

    const ticket = await Ticket.findById(id).populate({
      path: "reservationId",
      populate: [
        { path: "clientId", select: "nom prenom email telephone" },
        {
          path: "trajetId",
          select: "depart destination dateDepart heureDepart prix",
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du ticket",
      error: error.message,
    });
  }
};

// Get ticket by reservation ID
export const getTicketByReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reservationId)) {
      return res.status(400).json({
        success: false,
        message: "ID de réservation invalide",
      });
    }

    const ticket = await Ticket.findOne({ reservationId }).populate({
      path: "reservationId",
      populate: [
        { path: "clientId", select: "nom prenom email telephone" },
        {
          path: "trajetId",
          select: "depart destination dateDepart heureDepart prix",
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Aucun ticket trouvé pour cette réservation",
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du ticket",
      error: error.message,
    });
  }
};

// Update ticket seat numbers
export const updateTicketSeats = async (req, res) => {
  try {
    const { id } = req.params;
    const { numeroSiege } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de ticket invalide",
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { numeroSiege },
      { new: true }
    ).populate({
      path: "reservationId",
      populate: [
        { path: "clientId", select: "nom prenom email telephone" },
        {
          path: "trajetId",
          select: "depart destination dateDepart heureDepart prix",
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Numéros de siège mis à jour avec succès",
      data: ticket,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du ticket",
      error: error.message,
    });
  }
};
