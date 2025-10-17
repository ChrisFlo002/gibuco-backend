import Agent from "../models/agent.model.js";
import User from "../models/user.model.js";
import Agency from "../models/agency.model.js";

// @desc    Create new agent
// @route   POST /api/agents
// @access  Private (Admin)
export const createAgent = async (req, res) => {
  try {
    const { agenceId, userId } = req.body;

    // Check if required fields are provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir l'ID de l'agence et l'ID de l'utilisateur",
      });
    }

    // Check if agency exists
    if (agenceId) {
      const agency = await Agency.findById(agenceId);
      if (!agency) {
        return res.status(404).json({
          success: false,
          message: "Agence non trouvée",
        });
      }
    }

    // Check if user exists and has Agent role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    if (user.role !== "Agent") {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur doit avoir le rôle Agent",
      });
    }

    // Check if user is already an agent
    const existingAgent = await Agent.findOne({ userId });
    if (existingAgent) {
      return res.status(400).json({
        success: false,
        message: "Cet utilisateur est déjà un agent",
      });
    }

    // Create new agent
    const agent = new Agent({
      agenceId,
      userId,
    });

    await agent.save();

    // Populate the agent with user and agency details
    /*const populatedAgent = await Agent.findById(agent._id)
      .populate({
        path: "userId",
        select: "userId nom email telephone role statut",
      })
      .populate({
        path: "agenceId",
        select: "nom ville adresse telephone province",
      });*/

    res.status(201).json({
      success: true,
      message: "Agent créé avec succès",
      data: agent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get agent with agency details
// @route   GET /api/agents/:id
// @access  Private
export const getAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const agent = await Agent.findById(id)
      .populate({
        path: "userId",
        select: "userId nom email telephone role statut",
      })
      .populate({
        path: "agenceId",
        select: "nom ville adresse telephone province",
      });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: "Agent non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Agent récupéré avec succès",
      data: agent,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID agent invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get all agents with pagination
// @route   GET /api/agents
// @access  Private
export const getAgents = async (req, res) => {
  try {
    const { page = 1, limit = 10, agenceId } = req.query;

    // Build filter object
    const filter = {};
    if (agenceId) {
      filter.agenceId = agenceId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const agents = await Agent.find(filter)
      .populate({
        path: "userId",
        select: "userId nom email telephone role statut",
      })
      .populate({
        path: "agenceId",
        select: "nom ville adresse telephone province",
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Agent.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Agents récupérés avec succès",
      data: agents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalAgents: total,
        hasNext: skip + agents.length < total,
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

// @desc    get agent by userId
// @route   get /api/agents/user/:id
// @access  Private
export const getAgentByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const agent = await Agent.findOne({ userId }).populate({
      path: "agenceId",
      select: "nom ville adresse telephone province",
    });

    if (!agent) {
      return res.status(404).json({
        message: "Agent non trouvé pour cet identifiant utilisateur.",
      });
    }

    res.status(200).json(agent);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'agent :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// desc update agent agence by userId
// route put /api/agents/user/:id
// access private
export const updateAgentByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const { agenceId } = req.body;

    const agent = await Agent.findOne({ userId });

    if (!agent) {
      return res.status(404).json({
        message: "Agent non trouvé pour cet identifiant utilisateur.",
      });
    }

    agent.agenceId = agenceId;
    await agent.save();

    res.status(200).json(agent);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'agent :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};