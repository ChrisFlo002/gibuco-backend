import express from "express";
import {
  registerUser,
  activateUser,
  deactivateUser,
  loginUser,
  logoutUser,
  getUsersByRole,
  getUserById,
  getUsersToday,
  getUsers,
  updateUser,
} from "../controllers/user.controller.js";
import { protect, admin } from "../middleware/auth.middleware.js";

const router = express.Router();


// Public routes
router.post("/login", loginUser);

// Protected routes (require authentication)
//router.use(protect); // All routes below this middleware require authentication

// Logout route
router.post("/logout", logoutUser);

// Get user by ID
router.get("/:id", protect,getUserById);

// Get users by role
router.get("/role/:role", getUsersByRole);
// Get all users
router.get("/", getUsers);
// Get users created today
router.get("/today", getUsersToday);
router.post("/register", registerUser);
// Admin only routes
router.put("/:id/activate", protect, admin, activateUser);
router.put("/:id/deactivate", protect, admin, deactivateUser);
router.put("/:id", protect, admin, updateUser);

export default router;
