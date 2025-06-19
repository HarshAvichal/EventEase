import express from "express";
import { 
    signup, 
    login, 
    logout, 
    requestPasswordReset, 
    resetPassword, 
    refreshToken, 
    getMe,
    updateProfile,
    deleteAccount
} from "../controllers/Auth.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

// ==========================================
// Authentication Routes
// ==========================================
router.post("/signup", signup);           // Register new user
router.post("/login", login);             // User login
router.post("/logout", auth, logout);     // User logout
router.get("/me", auth, getMe);           // Get authenticated user's details

// ==========================================
// Token Management Routes
// ==========================================
router.post("/refresh-token", refreshToken);  // Get new access token using refresh token

// ==========================================
// Password Management Routes
// ==========================================
router.post("/request-reset", requestPasswordReset);  // Request password reset
router.post("/reset-password/:token", resetPassword);        // Reset password with token

// ==========================================
// User Profile Management
// ==========================================
router.patch("/me", auth, updateProfile);      // Update profile (firstName, lastName)
router.delete("/me", auth, deleteAccount);     // Delete account

export default router;
