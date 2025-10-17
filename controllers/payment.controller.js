import Payment from "../models/payment.model.js";
import Reservation from "../models/reservation.model.js";
import Trajet from "../models/trajet.model.js";

// Create a new payment
export const createPayment = async (req, res) => {
  try {
    const { reservationId, montant, methodePaiement, statut } = req.body;

    // Validate required fields
    if (!reservationId || !montant || !methodePaiement) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs requis doivent être fournis"
      });
    }

    // Verify that the reservation exists
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Réservation non trouvée"
      });
    }
    const trajet = await Trajet.findById(reservation.trajetId);
    // Validate payment method
    const validMethods = ["Lumicash", "cash", "Ecocash", "Enoti"];
    if (!validMethods.includes(methodePaiement)) {
      return res.status(400).json({
        success: false,
        message: "Méthode de paiement invalide"
      });
    }

    const payment = new Payment({
      reservationId,
      montant,
      methodePaiement,
      statut,
    });
    //modify the statut of reservation
    reservation.statut = "confirmee";
    reservation.save();
    //update the trajet seats
    const newSeats = trajet.capacite - reservation.nombrePassagers;
    trajet.capacite = newSeats;
    await trajet.save();
    await payment.save();

    // Populate the payment with reservation details
    const populatedPayment = await Payment.findById(payment._id)
      .populate({
        path: 'reservationId', select: 'prix nombrePassagers',
        populate: [
          { path: 'clientId', select: 'nom  email telephone' },
          { path: 'trajetId', select: 'villeDepart villeArrivee dateDepart heureDepart prix capacite' }
        ]
      });

    res.status(201).json({
      success: true,
      message: "Paiement créé avec succès",
      data: populatedPayment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du paiement",
      error: error.message
    });
  }
};

// Modify payment status
export const modifyStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Validate status
    const validStatuts = ["en_attente", "complete", "echoue", "rembourse"];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide"
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      id,
      { statut },
      { new: true }
    ).populate({
      path: 'reservationId',
      populate: [
        { path: 'clientId', select: 'nom prenom email telephone' },
        { path: 'trajetId', select: 'depart destination dateDepart heureDepart prix' }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement non trouvé"
      });
    }

    res.status(200).json({
      success: true,
      message: "Statut du paiement mis à jour avec succès",
      data: payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
      error: error.message
    });
  }
};

// Get total amount per period
export const getTotalAmountPerPeriod = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    let dateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      // Custom date range
      dateFilter = {
        datePaiement: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      // Predefined periods
      switch (period) {
        case 'day':
          const startOfDay = new Date(now);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 59, 999);
          dateFilter = {
            datePaiement: { $gte: startOfDay, $lte: endOfDay }
          };
          break;
        
        case 'week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          dateFilter = {
            datePaiement: { $gte: startOfWeek, $lte: endOfWeek }
          };
          break;
        
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          dateFilter = {
            datePaiement: { $gte: startOfMonth, $lte: endOfMonth }
          };
          break;
        
        default:
          return res.status(400).json({
            success: false,
            message: "Période invalide. Utilisez 'day', 'week', 'month' ou fournissez startDate et endDate"
          });
      }
    }

    const result = await Payment.aggregate([
      {
        $match: {
          statut: "complete",
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$montant" },
          totalPayments: { $sum: 1 },
          averageAmount: { $avg: "$montant" }
        }
      }
    ]);

    const stats = result[0] || {
      totalAmount: 0,
      totalPayments: 0,
      averageAmount: 0
    };

    res.status(200).json({
      success: true,
      data: {
        period: period || 'custom',
        dateRange: {
          start: startDate || dateFilter.datePaiement?.$gte,
          end: endDate || dateFilter.datePaiement?.$lte
        },
        stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du calcul du montant total",
      error: error.message
    });
  }
};

// Get amount per trajet
export const getAmountPerTrajet = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        datePaiement: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const result = await Payment.aggregate([
      {
        $match: {
          statut: "complete",
          ...dateFilter
        }
      },
      {
        $lookup: {
          from: "reservations",
          localField: "reservationId",
          foreignField: "_id",
          as: "reservation"
        }
      },
      {
        $unwind: "$reservation"
      },
      {
        $lookup: {
          from: "trajets",
          localField: "reservation.trajetId",
          foreignField: "_id",
          as: "trajet"
        }
      },
      {
        $unwind: "$trajet"
      },
      {
        $group: {
          _id: "$reservation.trajetId",
          trajetInfo: { $first: "$trajet" },
          totalAmount: { $sum: "$montant" },
          totalPayments: { $sum: 1 },
          totalPassengers: { $sum: "$reservation.nombrePassagers" }
        }
      },
      {
        $sort: { totalAmount: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: result.map(item => ({
        trajetId: item._id,
        trajet: {
          depart: item.trajetInfo.depart,
          destination: item.trajetInfo.destination,
          dateDepart: item.trajetInfo.dateDepart,
          heureDepart: item.trajetInfo.heureDepart,
          prix: item.trajetInfo.prix
        },
        totalAmount: item.totalAmount,
        totalPayments: item.totalPayments,
        totalPassengers: item.totalPassengers,
        averageAmount: item.totalAmount / item.totalPayments
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du calcul des montants par trajet",
      error: error.message
    });
  }
};

// Get today's amount
export const getAmountToday = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await Payment.aggregate([
      {
        $match: {
          statut: "complete",
          datePaiement: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$montant" },
          totalPayments: { $sum: 1 }
        }
      }
    ]);

    // Get breakdown by payment method
    const methodBreakdown = await Payment.aggregate([
      {
        $match: {
          statut: "complete",
          datePaiement: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        }
      },
      {
        $group: {
          _id: "$methodePaiement",
          amount: { $sum: "$montant" },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = result[0] || {
      totalAmount: 0,
      totalPayments: 0
    };

    res.status(200).json({
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        totalAmount: stats.totalAmount,
        totalPayments: stats.totalPayments,
        averageAmount: stats.totalPayments > 0 ? stats.totalAmount / stats.totalPayments : 0,
        methodBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors du calcul du montant d'aujourd'hui",
      error: error.message
    });
  }
};