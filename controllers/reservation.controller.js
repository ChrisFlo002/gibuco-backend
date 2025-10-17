import { populate } from "dotenv";
import Reservation from "../models/reservation.model.js";
import mongoose from "mongoose";

// Create a new reservation
export const createReservation = async (req, res) => {
  try {
    const { clientId, trajetId, nombrePassagers, montant, statut } = req.body;

    // Validate required fields
    if (!clientId || !trajetId || !nombrePassagers || !montant) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs requis doivent être fournis",
      });
    }

    const reservation = new Reservation({
      clientId,
      trajetId,
      nombrePassagers,
      montant,
      statut,
    });

    await reservation.save();

    res.status(201).json({
      success: true,
      message: "Réservation créée avec succès",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la réservation",
      error: error.message,
    });
  }
};

// Modify reservation status
export const modifyStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Validate status
    const validStatuts = ["en_attente", "confirmee", "annulee", "terminee"];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide",
      });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      { statut },
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée",
      });
    }

    res.status(200).json({
      success: true,
      message: "Statut mis à jour avec succès",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
      error: error.message,
    });
  }
};

// Modify reservation
export const modifyReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.bookingId;
    delete updateData.dateReservation;

    const reservation = await Reservation.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée",
      });
    }

    res.status(200).json({
      success: true,
      message: "Réservation mise à jour avec succès",
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de la réservation",
      error: error.message,
    });
  }
};

// Get all reservations with joins
export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("clientId", "nom email telephone")
      .populate(
        "trajetId",
        "villeDepart villeArrivee dateDepart heureDepart prix"
      );

    const total = await Reservation.countDocuments();

    res.status(200).json({
      success: true,
      data: reservations,
      total: total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des réservations",
      error: error.message,
    });
  }
};

// Get reservation by ID
export const getReservationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de réservation invalide",
      });
    }

    const reservation = await Reservation.findById(id)
      .populate("clientId", "nom prenom email telephone")
      .populate("trajetId", "depart destination dateDepart heureDepart prix");

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée",
      });
    }

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la réservation",
      error: error.message,
    });
  }
};

// Get reservations by client
export const getReservationByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { page = 1, limit = 10, statut } = req.query;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: "ID client invalide",
      });
    }

    let filter = { clientId };
    if (statut) {
      filter.statut = statut;
    }

    const reservations = await Reservation.find(filter)
      .populate({
        path: "trajetId",
        select:
          "villeDepart villeArrivee dateDepart heureDepart prix",
        populate: [
          {
            path: "busId",
            select: " modele  immatriculation",
          },
        ],
      })
      .populate("clientId", "nom email telephone")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dateReservation: -1 });

    const total = await Reservation.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: reservations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReservations: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des réservations du client",
      error: error.message,
    });
  }
};

// Get today's reservations
export const getTodayReservation = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await Reservation.find({
      dateReservation: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate("clientId", "nom prenom email telephone")
      .populate("trajetId", "depart destination dateDepart heureDepart prix")
      .sort({ dateReservation: -1 });

    const stats = {
      total: reservations.length,
      en_attente: reservations.filter((r) => r.statut === "en_attente").length,
      confirmee: reservations.filter((r) => r.statut === "confirmee").length,
      annulee: reservations.filter((r) => r.statut === "annulee").length,
      terminee: reservations.filter((r) => r.statut === "terminee").length,
      montantTotal: reservations.reduce((sum, r) => sum + r.montant, 0),
    };

    res.status(200).json({
      success: true,
      data: reservations,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des réservations d'aujourd'hui",
      error: error.message,
    });
  }
};
