import Administrateur from "../models/administrateur.model.js";
import User from "../models/user.model.js";

// @desc    Create new admin
// @route   POST /api/admins
// @access  Private (Super Admin only)
export const createAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir l'ID de l'utilisateur",
      });
    }

    // Check if user exists and has Admin role
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    if (user.role !== "Admin") {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur doit avoir le rôle Admin",
      });
    }

    // Check if user is already an admin
    const existingAdmin = await Administrateur.findOne({ userId });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Cet utilisateur est déjà un administrateur",
      });
    }

    // Create new admin
    const admin = new Administrateur({
      userId,
    });

    await admin.save();

    // Populate the admin with user details
    const populatedAdmin = await Administrateur.findById(admin._id).populate({
      path: "userId",
      select: "userId nom email telephone role statut",
    });

    res.status(201).json({
      success: true,
      message: "Administrateur créé avec succès",
      data: populatedAdmin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get all admins with user info
// @route   GET /api/admins
// @access  Private (Admin only)
export const getAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 10, statut } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build match condition for user status if provided
    const matchCondition = {};
    if (statut !== undefined) {
      matchCondition["userId.statut"] = statut === "true";
    }

    const admins = await Administrateur.find()
      .populate({
        path: "userId",
        select: "userId nom email telephone role statut createdAt",
        match:
          Object.keys(matchCondition).length > 0 ? matchCondition : undefined,
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Filter out admins where user population failed (due to match condition)
    const filteredAdmins = admins.filter((admin) => admin.userId !== null);

    const total = await Administrateur.countDocuments();

    res.status(200).json({
      success: true,
      message: "Administrateurs récupérés avec succès",
      data: filteredAdmins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalAdmins: total,
        hasNext: skip + filteredAdmins.length < total,
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

// @desc    Get admin by ID with user info
// @route   GET /api/admins/:id
// @access  Private (Admin only)
export const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Administrateur.findById(id).populate({
      path: "userId",
      select: "userId nom email telephone role statut createdAt",
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Administrateur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Administrateur récupéré avec succès",
      data: admin,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID administrateur invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Delete admin
// @route   DELETE /api/admins/:id
// @access  Private (Super Admin only)
export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Administrateur.findById(id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Administrateur non trouvé",
      });
    }

    // Prevent admin from deleting themselves
    if (req.user && admin.userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message:
          "Vous ne pouvez pas supprimer votre propre compte administrateur",
      });
    }

    await Administrateur.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Administrateur supprimé avec succès",
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID administrateur invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
