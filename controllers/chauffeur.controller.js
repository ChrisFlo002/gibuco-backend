import Chauffeur from "../models/chauffeur.model.js";
import User from "../models/user.model.js";

// @desc    Create new chauffeur
// @route   POST /api/chauffeurs
// @access  Private (Admin/Agent)
export const createChauffeur = async (req, res) => {
  try {
    const { userId, licenseConduire } = req.body;

    // Check if required fields are provided
    if (!userId || !licenseConduire) {
      return res.status(400).json({
        success: false,
        message:
          "Veuillez fournir l'ID de l'utilisateur et le numéro de licence de conduire",
      });
    }

    // Check if user exists and has Driver role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    if (user.role !== "Chauffeur") {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur doit avoir le rôle Chauffeur",
      });
    }

    // Check if user is already a chauffeur
    const existingChauffeur = await Chauffeur.findOne({ userId });
    if (existingChauffeur) {
      return res.status(400).json({
        success: false,
        message: "Cet utilisateur est déjà un chauffeur",
      });
    }

    // Check if licence number is already used
    const existingLicence = await Chauffeur.findOne({ licenseConduire });
    if (existingLicence) {
      return res.status(400).json({
        success: false,
        message: "Ce numéro de licence de conduire est déjà utilisé",
      });
    }

    // Create new chauffeur
    const chauffeur = new Chauffeur({
      userId,
      licenceConduire: licenseConduire,
    });

    await chauffeur.save();

    // Populate the chauffeur with user details
    /*const populatedChauffeur = await Chauffeur.findById(chauffeur._id).populate(
      {
        path: "userId",
        select: "userId nom email telephone role statut",
      }
    );*/

    res.status(201).json({
      success: true,
      message: "Chauffeur créé avec succès",
      data: chauffeur,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ce numéro de licence de conduire est déjà utilisé",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get chauffeur by ID with user info
// @route   GET /api/chauffeurs/:id
// @access  Private
export const getChauffeur = async (req, res) => {
  try {
    const { id } = req.params;

    const chauffeur = await Chauffeur.findById(id).populate({
      path: "userId",
      select: "userId nom email telephone role statut",
    });

    if (!chauffeur) {
      return res.status(404).json({
        success: false,
        message: "Chauffeur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Chauffeur récupéré avec succès",
      data: chauffeur,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID chauffeur invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get all chauffeurs with user info
// @route   GET /api/chauffeurs
// @access  Private
export const getChauffeurs = async (req, res) => {
  try {

    const chauffeurs = await Chauffeur.find()
      .populate({
        path: "userId",
        select: "userId nom email telephone role statut",
      });

    const total = await Chauffeur.countDocuments();

    res.status(200).json({
      success: true,
      message: "Chauffeurs récupérés avec succès",
      data: chauffeurs,
      total: total, 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Update chauffeur licence
// @route   PUT /api/chauffeurs/:id/licence
// @access  Private (Admin/Agent)
export const updateChauffeurLicence = async (req, res) => {
  try {
    const { id } = req.params;
    const { licenceConduire } = req.body;

    if (!licenceConduire) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir le numéro de licence de conduire",
      });
    }

    const chauffeur = await Chauffeur.findById(id);
    if (!chauffeur) {
      return res.status(404).json({
        success: false,
        message: "Chauffeur non trouvé",
      });
    }

    // Check if new licence number is already used by another chauffeur
    const existingLicence = await Chauffeur.findOne({
      licenceConduire: licenceConduire.trim(),
      _id: { $ne: id }, // Exclude current chauffeur
    });

    if (existingLicence) {
      return res.status(400).json({
        success: false,
        message: "Ce numéro de licence de conduire est déjà utilisé",
      });
    }

    chauffeur.licenceConduire = licenceConduire.trim();
    await chauffeur.save();

    // Populate and return updated chauffeur
    const updatedChauffeur = await Chauffeur.findById(chauffeur._id).populate({
      path: "userId",
      select: "userId nom email telephone role statut",
    });

    res.status(200).json({
      success: true,
      message: "Licence de conduire mise à jour avec succès",
      data: updatedChauffeur,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID chauffeur invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get chauffeur by licence number
// @route   GET /api/chauffeurs/licence/:licenceNumber
// @access  Private
export const getChauffeurByLicence = async (req, res) => {
  try {
    const { licenceNumber } = req.params;

    const chauffeur = await Chauffeur.findOne({
      licenceConduire: licenceNumber,
    }).populate({
      path: "userId",
      select: "userId nom email telephone role statut",
    });

    if (!chauffeur) {
      return res.status(404).json({
        success: false,
        message: "Chauffeur non trouvé avec ce numéro de licence",
      });
    }

    res.status(200).json({
      success: true,
      message: "Chauffeur récupéré avec succès",
      data: chauffeur,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get chauffeur by user ID
// @route   GET /api/chauffeurs/user/:id
// @access  Private
export const getChauffeurByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const chauffeur = await Chauffeur.findOne({ userId });

    if (!chauffeur) {
      return res
        .status(404)
        .json({ message: "Chauffeur non rencontré pour cet identifiant utilisateur." });
    }

    res.status(200).json(chauffeur);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};