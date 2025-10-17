const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Client = require("../models/Client");
const Agent = require("../models/Agent");
const Administrateur = require("../models/Administrateur");
const Chauffeur = require("../models/Chauffeur");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      nom: user.nom,
      email: user.email,
      role: user.role,
    },
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { nom, email, telephone, motDePasse, role, ...additionalData } =
      req.body;

    let user;
    const userData = { nom, email, telephone, motDePasse, role };

    switch (role) {
      case "client":
        user = new Client(userData);
        break;
      case "agent":
        user = new Agent({ ...userData, ...additionalData });
        break;
      case "administrateur":
        user = new Administrateur(userData);
        break;
      case "chauffeur":
        user = new Chauffeur({ ...userData, ...additionalData });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid role specified",
        });
    }

    await user.save();
    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+motDePasse");

    if (!user || !(await user.comparePassword(motDePasse))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
