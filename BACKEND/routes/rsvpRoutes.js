import express from "express";
import { rsvpEvent, cancelRSVP, countParticipants, getEventAttendees } from "../controllers/Rsvp.js";
import { auth, isParticipant } from "../middlewares/auth.js";

const router = express.Router();

// RSVP routes
router.post("/:eventId", auth, isParticipant, rsvpEvent); // RSVP to an event
router.post("/:eventId/cancel", auth, isParticipant, cancelRSVP); // Cancel RSVP
router.get("/:eventId/count", auth, countParticipants); // Get count of participants for the event
router.get('/:eventId/attendees', auth, getEventAttendees); // Get list of attendees for the event

export default router;
