import Client from "../models/client.model.js";
import User from "../models/user.model.js";

// @desc    Create new client
// @route   POST /api/clients
// @access  Private (Admin/Agent)
export const createClient = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir l'ID de l'utilisateur",
      });
    }

    // Check if user exists and has Client role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    if (user.role !== "Client") {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur doit avoir le rôle Client",
      });
    }

    // Check if user is already a client
    const existingClient = await Client.findOne({ userId });
    if (existingClient) {
      return res.status(400).json({
        success: false,
        message: "Cet utilisateur est déjà un client",
      });
    }

    // Create new client with 0 points
    const client = new Client({
      userId,
      pointsFidelite: 0,
    });

    await client.save();

    // Populate the client with user details
    const populatedClient = await Client.findById(client._id)
      .populate({
        path: "userId",
        select: "userId nom email telephone role statut",
      });

    res.status(201).json({
      success: true,
      message: "Client créé avec succès",
      data: populatedClient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Modify client points
// @route   PUT /api/clients/:id/points
// @access  Private (Admin/Agent)
export const modifyPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { points, operation } = req.body; // operation: 'add', 'subtract', 'set'

    // Validate input
    if (points === undefined || !operation) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir les points et l'opération (add, subtract, set)",
      });
    }

    if (typeof points !== "number" || points < 0) {
      return res.status(400).json({
        success: false,
        message: "Les points doivent être un nombre positif",
      });
    }

    if (!["add", "subtract", "set"].includes(operation)) {
      return res.status(400).json({
        success: false,
        message: "Opération invalide. Utilisez: add, subtract, ou set",
      });
    }

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    // Perform operation
    let newPoints;
    switch (operation) {
      case "add":
        newPoints = client.pointsFidelite + points;
        break;
      case "subtract":
        newPoints = Math.max(0, client.pointsFidelite - points); // Prevent negative points
        break;
      case "set":
        newPoints = points;
        break;
    }

    client.pointsFidelite = newPoints;
    await client.save();

    // Populate and return updated client
    const updatedClient = await Client.findById(client._id)
      .populate({
        path: "userId",
        select: "userId nom email telephone role statut",
      });

    res.status(200).json({
      success: true,
      message: "Points de fidélité mis à jour avec succès",
      data: updatedClient,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID client invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get all clients with user info
// @route   GET /api/clients
// @access  Private
export const getClients = async (req, res) => {
  try {
    const { page = 1, limit = 10, minPoints, maxPoints } = req.query;

    // Build filter object
    const filter = {};
    if (minPoints !== undefined) {
      filter.pointsFidelite = { ...filter.pointsFidelite, $gte: parseInt(minPoints) };
    }
    if (maxPoints !== undefined) {
      filter.pointsFidelite = { ...filter.pointsFidelite, $lte: parseInt(maxPoints) };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const clients = await Client.find(filter)
      .populate({
        path: "userId",
        select: "userId nom email telephone role statut",
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ pointsFidelite: -1 }); // Sort by points descending

    const total = await Client.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Clients récupérés avec succès",
      data: clients,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalClients: total,
        hasNext: skip + clients.length < total,
        hasPrev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get client by ID with user info
// @route   GET /api/clients/:id
// @access  Private
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id)
      .populate({
        path: "userId",
        select: "userId nom email telephone role statut",
      });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Client récupéré avec succès",
      data: client,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID client invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get clients with highest points
// @route   GET /api/clients/top-points
// @access  Private
export const getClientsWithHighestPoints = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const clients = await Client.find()
      .populate({
        path: "userId",
        select: "userId nom email telephone role statut",
      })
      .sort({ pointsFidelite: -1 }) // Sort by points descending
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Clients avec le plus de points récupérés avec succès",
      data: clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};