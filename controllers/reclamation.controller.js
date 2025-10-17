import Reclamation from "../models/reclamation.model.js";
import mongoose from "mongoose";

// Create a new reclamation
export const createReclamation = async (req, res) => {
  try {
    const { clientId, sujet, description } = req.body;

    // Validate required fields
    if (!clientId || !sujet || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Tous les champs requis doivent être fournis (clientId, sujet, description)",
      });
    }

    // Validate clientId format
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: "ID client invalide",
      });
    }

    const reclamation = new Reclamation({
      clientId,
      sujet: sujet.trim(),
      description: description.trim(),
    });

    await reclamation.save();

    // Populate the reclamation with client details
    const populatedReclamation = await Reclamation.findById(
      reclamation._id
    ).populate("clientId", "nom prenom email telephone");

    res.status(201).json({
      success: true,
      message: "Réclamation créée avec succès",
      data: populatedReclamation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la création de la réclamation",
      error: error.message,
    });
  }
};

// Modify reclamation status
export const modifyStatut = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    // Validate reclamation ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de réclamation invalide",
      });
    }

    // Validate status
    const validStatuts = ["ouverte", "en_cours", "resolue", "fermee"];
    if (!validStatuts.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide. Statuts valides: " + validStatuts.join(", "),
      });
    }

    const reclamation = await Reclamation.findByIdAndUpdate(
      id,
      { statut },
      { new: true, runValidators: true }
    ).populate("clientId", "nom prenom email telephone");

    if (!reclamation) {
      return res.status(404).json({
        success: false,
        message: "Réclamation non trouvée",
      });
    }

    res.status(200).json({
      success: true,
      message: "Statut de la réclamation mis à jour avec succès",
      data: reclamation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
      error: error.message,
    });
  }
};

// Get all reclamations with pagination and filtering
export const getReclamations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      statut,
      sortBy = "dateCreation",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    let filter = {};
    if (statut) {
      filter.statut = statut;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const reclamations = await Reclamation.find(filter)
      .populate("clientId", "nom prenom email telephone")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await Reclamation.countDocuments(filter);

    // Get statistics
    const stats = await Reclamation.aggregate([
      {
        $group: {
          _id: "$statut",
          count: { $sum: 1 },
        },
      },
    ]);

    const statistiques = {
      total,
      ouverte: stats.find((s) => s._id === "ouverte")?.count || 0,
      en_cours: stats.find((s) => s._id === "en_cours")?.count || 0,
      resolue: stats.find((s) => s._id === "resolue")?.count || 0,
      fermee: stats.find((s) => s._id === "fermee")?.count || 0,
    };

    res.status(200).json({
      success: true,
      data: reclamations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReclamations: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      statistiques,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des réclamations",
      error: error.message,
    });
  }
};

// Get reclamation by ID
export const getReclamationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de réclamation invalide",
      });
    }

    const reclamation = await Reclamation.findById(id).populate(
      "clientId",
      "nom prenom email telephone"
    );

    if (!reclamation) {
      return res.status(404).json({
        success: false,
        message: "Réclamation non trouvée",
      });
    }

    res.status(200).json({
      success: true,
      data: reclamation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la réclamation",
      error: error.message,
    });
  }
};

// Get reclamations by client
export const getReclamationByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const {
      page = 1,
      limit = 10,
      statut,
      sortBy = "dateCreation",
      sortOrder = "desc",
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({
        success: false,
        message: "ID client invalide",
      });
    }

    // Build filter object
    let filter = { clientId };
    if (statut) {
      filter.statut = statut;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const reclamations = await Reclamation.find(filter)
      .populate("clientId", "nom prenom email telephone")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await Reclamation.countDocuments(filter);

    // Get client-specific statistics
    const clientStats = await Reclamation.aggregate([
      {
        $match: { clientId: new mongoose.Types.ObjectId(clientId) },
      },
      {
        $group: {
          _id: "$statut",
          count: { $sum: 1 },
        },
      },
    ]);

    const statistiques = {
      total,
      ouverte: clientStats.find((s) => s._id === "ouverte")?.count || 0,
      en_cours: clientStats.find((s) => s._id === "en_cours")?.count || 0,
      resolue: clientStats.find((s) => s._id === "resolue")?.count || 0,
      fermee: clientStats.find((s) => s._id === "fermee")?.count || 0,
    };

    res.status(200).json({
      success: true,
      data: reclamations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReclamations: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      statistiques,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des réclamations du client",
      error: error.message,
    });
  }
};

// Get reclamation statistics (bonus function for dashboard)
export const getReclamationStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter if provided
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        dateCreation: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    }

    // Get overall statistics
    const overallStats = await Reclamation.aggregate([
      {
        $match: dateFilter,
      },
      {
        $group: {
          _id: "$statut",
          count: { $sum: 1 },
        },
      },
    ]);

    // Get monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Reclamation.aggregate([
      {
        $match: {
          dateCreation: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$dateCreation" },
            month: { $month: "$dateCreation" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    // Get most active clients
    const topClients = await Reclamation.aggregate([
      {
        $match: dateFilter,
      },
      {
        $group: {
          _id: "$clientId",
          reclamationCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "clientInfo",
        },
      },
      {
        $unwind: "$clientInfo",
      },
      {
        $sort: { reclamationCount: -1 },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          _id: 1,
          reclamationCount: 1,
          "clientInfo.nom": 1,
          "clientInfo.prenom": 1,
          "clientInfo.email": 1,
        },
      },
    ]);

    const statistics = {
      ouverte: overallStats.find((s) => s._id === "ouverte")?.count || 0,
      en_cours: overallStats.find((s) => s._id === "en_cours")?.count || 0,
      resolue: overallStats.find((s) => s._id === "resolue")?.count || 0,
      fermee: overallStats.find((s) => s._id === "fermee")?.count || 0,
      total: overallStats.reduce((sum, stat) => sum + stat.count, 0),
    };

    res.status(200).json({
      success: true,
      data: {
        statistics,
        monthlyTrend,
        topClients,
        dateRange: startDate && endDate ? { startDate, endDate } : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
};
