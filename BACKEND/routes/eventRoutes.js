import express from "express";
import {
    createEvent,
    getOrganizerUpcomingEvents,    // Fetch upcoming events for the organizer
    getOrganizerCompletedEvents,   // Fetch completed events for the organizer
    getParticipantUpcomingEvents,  // Fetch all upcoming events for participants
    getParticipantCompletedEvents, // Fetch all completed events for participants
    getParticipantMyEvents,        // Fetch RSVP'd (my) events for participants
    getEventDetails,
    deleteEvent,
    updateEvent,
    searchEvents,
    getOrganizerAllEvents,
    cancelEvent,
} from "../controllers/Event.js";
import { auth, isOrganizer, isParticipant } from "../middlewares/auth.js";
import { upload, handleUploadError } from "../utils/cloudinary.js";
import { createFeedback, getEventFeedback } from '../controllers/Feedback.js';

const router = express.Router();

// Organizer routes
router.post("/create", auth, isOrganizer, upload.single("thumbnail"), handleUploadError, createEvent); 
router.get("/organizer/upcoming", auth, isOrganizer, getOrganizerUpcomingEvents); // Fetch upcoming events
router.get("/organizer/completed", auth, isOrganizer, getOrganizerCompletedEvents); // Fetch completed events
router.get("/organizer/all", auth, isOrganizer, getOrganizerAllEvents);
router.patch("/:id", auth, isOrganizer, upload.single("thumbnail"), handleUploadError, updateEvent);
router.patch('/:id/cancel', auth, isOrganizer, cancelEvent);

// Participant routes
router.get("/participant/upcoming", auth, isParticipant, getParticipantUpcomingEvents); // Fetch all upcoming events
router.get("/participant/completed", auth, isParticipant, getParticipantCompletedEvents); // Fetch all completed events
router.get("/participant/my-events", auth, isParticipant, getParticipantMyEvents); // Fetch RSVP'd (my) events
router.get("/details/:id", auth, getEventDetails); // Fetch event details

// General routes
router.delete("/:id", auth, isOrganizer, deleteEvent); // Delete an event
router.get("/search", searchEvents); // Search for events by filters (no auth required)

// Feedback routes
router.post('/feedback/:eventId', auth, createFeedback);
router.get('/feedback/:eventId', auth, getEventFeedback);

export default router;
