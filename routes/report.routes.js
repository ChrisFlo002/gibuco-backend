// routes/reports.js
import express from "express";
import mongoose from "mongoose";
import Reservation from "../models/reservation.model.js";
import Trajet from "../models/trajet.model.js";
import Bus from "../models/bus.model.js";
import User from "../models/user.model.js";
import Client from "../models/client.model.js";

const router = express.Router();

// Helper function to build date filter
const buildDateFilter = (period, startDate, endDate) => {
  const now = new Date();
  let filter = {};

  if (startDate && endDate) {
    // Custom range
    filter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else {
    // Predefined periods
    switch (period) {
      case "day":
        const startOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const endOfDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 1
        );
        filter = { $gte: startOfDay, $lt: endOfDay };
        break;
      case "week":
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const endOfWeek = new Date(
          now.setDate(now.getDate() - now.getDay() + 7)
        );
        filter = { $gte: startOfWeek, $lt: endOfWeek };
        break;
      case "month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        filter = { $gte: startOfMonth, $lt: endOfMonth };
        break;
      case "year":
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
        filter = { $gte: startOfYear, $lt: endOfYear };
        break;
      default:
        // Default to current month
        const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        filter = { $gte: defaultStart, $lt: defaultEnd };
    }
  }

  return filter;
};

// Get revenue report
router.get("/revenue", async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(period, startDate, endDate);

    // Get total revenue from confirmed reservations
    const totalRevenueResult = await Reservation.aggregate([
      {
        $match: {
          statut: "confirmee",
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$montant" },
        },
      },
    ]);

    // Get revenue per trip line (villeDepart to villeArrivee)
    const revenuePerTripLine = await Reservation.aggregate([
      {
        $match: {
          statut: "confirmee",
          createdAt: dateFilter,
        },
      },
      {
        $lookup: {
          from: "trajets",
          localField: "trajetId",
          foreignField: "_id",
          as: "trajet",
        },
      },
      {
        $unwind: "$trajet",
      },
      {
        $group: {
          _id: {
            villeDepart: "$trajet.villeDepart",
            villeArrivee: "$trajet.villeArrivee",
          },
          totalRevenue: { $sum: "$montant" },
          totalReservations: { $sum: 1 },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;

    res.json({
      success: true,
      data: {
        totalRevenue,
        revenuePerTripLine,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching revenue report",
      error: error.message,
    });
  }
});

// Get bus occupancy rate (taux de remplissage)
router.get("/bus-occupancy", async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(period, startDate, endDate);

    const busOccupancy = await Trajet.aggregate([
      {
        $match: {
          statut: "termine",
          createdAt: dateFilter,
        },
      },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: ["$passagersArrive", "$bus.capacite"] },
              100,
            ],
          },
        },
      },
      {
        $group: {
          _id: "$busId",
          busInfo: { $first: "$bus" },
          averageOccupancyRate: { $avg: "$occupancyRate" },
          totalTrips: { $sum: 1 },
        },
      },
      {
        $sort: { averageOccupancyRate: -1 },
      },
    ]);

    res.json({
      success: true,
      data: busOccupancy,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching bus occupancy report",
      error: error.message,
    });
  }
});

// Get top clients
router.get("/top-clients", async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(period, startDate, endDate);

    const topClients = await Reservation.aggregate([
      {
        $match: {
          statut: "confirmee",
          createdAt: dateFilter,
        },
      },
      {
        $group: {
          _id: "$clientId",
          totalReservations: { $sum: 1 },
          totalSpent: { $sum: "$montant" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "client",
        },
      },
      {
        $unwind: "$client",
      },
      {
        $lookup: {
          from: "clients",
          localField: "client._id",
          foreignField: "userId",
          as: "clientDetails",
        },
      },
      {
        $unwind: {
          path: "$clientDetails",
          preserveNullAndEmptyArrays: true, // Ensures clients without entries in Client are still included
        },
      },
      {
        $sort: { totalReservations: -1 },
      },
      {
        $limit: 3,
      },
      {
        $project: {
          _id: 1,
          totalReservations: 1,
          totalSpent: 1,
          "client.nom": 1, // Assuming name exists in the users collection
          "client.email": 1,
          "client.telephone": 1,
          "clientDetails.pointsFidelite": 1,
        },
      },
    ]);

    res.json({
      success: true,
      data: topClients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching top clients report",
      error: error.message,
    });
  }
});

// Update client loyalty points
router.put("/update-loyalty-points/:clientId", async (req, res) => {
  try {
    const { clientId } = req.params;
    const { points } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({
        success: false,
        message: "Points must be a positive number",
      });
    }
    const user = await User.findById(clientId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
    const client = await Client.findOne({ userId: user._id });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }
    const newPoints = client.pointsFidelite + points;
    client.pointsFidelite = newPoints;
    await client.save();
    
    res.json({
      success: true,
      data: {
        clientId: user._id,
        name: user.nom,
        newLoyaltyPoints: client.pointsFidelite,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating loyalty points",
      error: error.message,
    });
  }
});

// Get comprehensive report data
router.get("/comprehensive", async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;

    // Make parallel requests to get all data
    const [revenueData, busOccupancyData, topClientsData] = await Promise.all([
      // Revenue data
      fetch(
        `${req.protocol}://${req.get(
          "host"
        )}/api/v1/reports/revenue?${new URLSearchParams(req.query)}`
      ).then((res) => res.json()),
      // Bus occupancy data
      fetch(
        `${req.protocol}://${req.get(
          "host"
        )}/api/v1/reports/bus-occupancy?${new URLSearchParams(req.query)}`
      ).then((res) => res.json()),
      // Top clients data
      fetch(
        `${req.protocol}://${req.get(
          "host"
        )}/api/v1/reports/top-clients?${new URLSearchParams(req.query)}`
      ).then((res) => res.json()),
    ]);

    res.json({
      success: true,
      data: {
        revenue: revenueData.data,
        busOccupancy: busOccupancyData.data,
        topClients: topClientsData.data,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching comprehensive report",
      error: error.message,
    });
  }
});

export default router;
