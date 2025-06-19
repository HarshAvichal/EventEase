import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import dbConnect from "./config/db.js";
import { corsMiddleware, corsDebugLogger } from "./config/cors.js";
import authRoutes from "./routes/authRoutes.js"; // Routes for authentication (login/signup)
import eventRoutes from "./routes/eventRoutes.js"; // Routes for event management
import rsvpRoutes from "./routes/rsvpRoutes.js"; // Routes for RSVP functionality
import { scheduleReminders } from "./utils/notificationScheduler.js";
import { errorHandler } from './middlewares/errorHandler.js'; // Re-enabled errorHandler
// import { apiLimiter } from './middlewares/rateLimiter.js'; // Removed as middleware files are deleted
// import { mongoSanitize, securityHeaders, customSanitizer } from './middlewares/sanitizer.js'; // Removed as middleware files are deleted

// Initialize express and dotenv
dotenv.config();
const app = express();

// Connect to database
dbConnect();

// Basic Middlewares
app.use(express.json());      // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser());      // Parse cookies
app.use(corsDebugLogger);     // Debug logger for CORS and headers
app.use(corsMiddleware);      // Enable CORS

// Add a request logger to see all incoming requests
app.use((req, res, next) => {
    next();
});

// Removed security middlewares as their files were deleted:
// app.use(securityHeaders);
// app.use(mongoSanitize);
// app.use(customSanitizer);
// app.use(apiLimiter);

// Use Routes
app.use("/api/v1/auth", authRoutes); // Authentication routes
app.use("/api/v1/events", eventRoutes); // Event-related routes
app.use("/api/v1/rsvp", rsvpRoutes); // RSVP-related routes

// Re-enabled error handler
app.use(errorHandler);

// Default PORT
const PORT = process.env.PORT || 5000;

// Welcome route (default endpoint)
app.get("/", (req, res) => {
    res.send("<h1>Welcome to the EventEase</h1>");
});

// Start reminder scheduler
scheduleReminders();

// Add global error handlers for better debugging
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
