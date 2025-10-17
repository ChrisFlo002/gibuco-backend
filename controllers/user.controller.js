import Client from "../models/client.model.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { nom, role, telephone, email, motDePasse, statut } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: "Iyo knoti isanzwe ibaho" });
      return;
    }

    // Create user
    const user = await User.create({
      nom,
      role,
      telephone,
      email,
      motDePasse,
      statut,
    });
    if (user.role === "Client") {
      await Client.create({
        userId: user._id,
        pointsFidelite: 0,
      });
    }
    if (user) {
      res.status(201).json({
        _id: user._id,
        userId: user.userId,
        nom: user.nom,
        role: user.role,
        telephone: user.telephone,
        email: user.email,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Activate user
// @route   PUT /api/users/:id/activate
// @access  Private (Admin)
export const activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    user.statut = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Utilisateur activé avec succès",
      data: {
        userId: user.userId,
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut: user.statut,
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

// @desc    Deactivate user
// @route   PUT /api/users/:id/deactivate
// @access  Private (Admin)
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    user.statut = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Utilisateur désactivé avec succès",
      data: {
        userId: user.userId,
        nom: user.nom,
        email: user.email,
        role: user.role,
        statut: user.statut,
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

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    // Check if email and password are provided
    if (!email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: "Veuillez fournir l'email et le mot de passe",
      });
    }

    // Find user by email and include password field
    const user = await User.findOne({ email }).select("+motDePasse");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Check if user is active
    if (!user.statut) {
      return res.status(401).json({
        success: false,
        message: "Compte désactivé. Contactez l'administrateur",
      });
    }

    // Check password
    const isPasswordValid = await user.matchPassword(motDePasse);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect",
      });
    }

    // Generate token
    const token = await user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: "Connexion réussie",
      _id: user._id,
      userId: user.userId,
      nom: user.nom,
      role: user.role,
      telephone: user.telephone,
      email: user.email,
      profil: user.role,
      token,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
export const logoutUser = async (req, res) => {
  try {
    // In a stateless JWT system, logout is typically handled on the client side
    // by removing the token from storage. However, you can implement token blacklisting
    // if needed for additional security.

    res.status(200).json({
      success: true,
      message: "Déconnexion réussie",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get users by role
// @route   GET /api/users/role/:role
// @access  Private
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate role
    const validRoles = ["Admin", "Agent", "Driver", "Client"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide",
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({ role })
      .select("-motDePasse")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ role });

    res.status(200).json({
      success: true,
      message: `Utilisateurs avec le rôle ${role} récupérés avec succès`,
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
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
// @desc    Get users
// @route   GET /api/users/
// @access  Private
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-motDePasse");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      message: "Utilisateur récupéré avec succès",
      data: user,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// @desc    Get users created today
// @route   GET /api/users/today
// @access  Private
export const getUsersToday = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Get start and end of today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find({
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    })
      .select("-motDePasse")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    });

    res.status(200).json({
      success: true,
      message: "Utilisateurs créés aujourd'hui récupérés avec succès",
      data: users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalUsers: total,
        hasNext: skip + users.length < total,
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

// @desc    Update user by ID
// @route   PUT /api/users/:id
// @access  Private
// Update user by ID
export const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // If password is being updated, hash it
    if (updates.motDePasse) {
      const salt = await bcrypt.genSalt(10);
      updates.motDePasse = await bcrypt.hash(updates.motDePasse, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-motDePasse"); // exclude password from response

    if (!updatedUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
