import RSVP from '../models/Rsvp.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { sendEmail } from '../utils/emailSender.js';

// RSVP for an Event
export const rsvpEvent = async (req, res, next) => {
    console.log('RSVP endpoint hit!', req.params.eventId, req.user.id);
    try {
        const { eventId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            console.log('DEBUG RSVP: Invalid event ID');
            return res.status(400).json({ message: "Invalid event ID" });
        }

        const event = await Event.findById(eventId);
        console.log('DEBUG RSVP: event:', event);
        if (!event) {
            console.log('DEBUG RSVP: Event not found');
            return res.status(404).json({ message: "Event not found" });
        }

        const currentDateTime = new Date(); // Local time
        const eventStartDateTime = new Date(`${event.date}T${event.startTime}`); // Local time
        if (currentDateTime >= eventStartDateTime) {
            console.log('DEBUG RSVP: RSVP not allowed after event start');
            return res.status(400).json({
                message: "RSVP is not allowed after the event has started or completed.",
            });
        }

        // Debug logs for RSVP status
        const existingRSVP = await RSVP.findOne({ eventId, participantId: req.user.id, status: "active" });
        console.log('DEBUG RSVP: existingRSVP:', existingRSVP);
        console.log('DEBUG RSVP: event.rsvpList for user:', event.rsvpList.filter(e => e.participantId.toString() === req.user.id));
        if (existingRSVP) {
            console.log('DEBUG RSVP: Already registered');
            return res.status(400).json({ message: "You have already RSVP'd for this event." });
        }

        // Create a new RSVP or update an existing canceled RSVP
        let rsvp = await RSVP.findOne({ eventId, participantId: req.user.id });
        if (rsvp) {
            rsvp.status = "active";
            rsvp.joinedAt = currentDateTime;
        } else {
            rsvp = new RSVP({
                eventId,
                participantId: req.user.id,
                joinedAt: currentDateTime,
            });
        }

        await rsvp.save();

        // Add the participant to the event's RSVP list
        if (!event.rsvpList.some((entry) => entry.participantId.toString() === req.user.id)) {
            event.rsvpList.push({ participantId: req.user.id, status: "active" });
            await event.save();
        }

        // Send confirmation email
        const participant = await User.findById(req.user.id);
        if (participant) {
            const emailContent = `
                <p>Dear ${participant.firstName},</p>
                <p>You have successfully registered for the event <strong>${event.title}</strong>.</p>
                <p><strong>Event Details:</strong></p>
                <ul>
                    <li>Date: ${event.date}</li>
                    <li>Time: ${event.startTime} - ${event.endTime} (EST)</li>
                    <li>Meeting Link: <a href="${event.meetingLink}">Join the event</a></li>
                </ul>
                <p>Thank you for registering! We look forward to seeing you at the event.</p>
            `;

            await sendEmail(
                participant.email,
                `RSVP Confirmation: ${event.title}`,
                emailContent
            );
        }

        res.status(201).json({ message: "RSVP successful" });
    } catch (error) {
        next(error);
    }
};

// Cancel RSVP for an Event
export const cancelRSVP = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        // Validate eventId
        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        // Fetch the event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        // Prevent RSVP cancellation for live or completed events
        const currentDateTime = new Date(); // Local time
        const eventStartDateTime = new Date(`${event.date}T${event.startTime}`); // Local time
        const eventEndDateTime = new Date(`${event.date}T${event.endTime}`); // Local time

        if (currentDateTime >= eventStartDateTime && currentDateTime <= eventEndDateTime) {
            return res.status(400).json({
                message: "RSVP cannot be canceled while the event is live.",
            });
        }
        if (currentDateTime >= eventEndDateTime) {
            return res.status(400).json({
                message: "RSVP cannot be canceled for an event that has already ended.",
            });
        }

        // Check if the user has an active RSVP for this event
        const rsvp = await RSVP.findOne({
            eventId,
            participantId: req.user.id,
            status: "active",
        });
        if (!rsvp) {
            return res.status(400).json({
                message: "You have not RSVP'd for this event or your RSVP is already canceled.",
            });
        }

        // Mark RSVP as canceled
        rsvp.status = "canceled";
        await rsvp.save();

        // Remove the participant from the event's RSVP list
        event.rsvpList = event.rsvpList.filter(
            (entry) => entry.participantId.toString() !== req.user.id
        );
        await event.save();

        // Send cancellation email
        const participant = await User.findById(req.user.id);
        if (participant) {
            await sendEmail(
                participant.email,
                `RSVP Canceled: ${event.title}`,
                `<p>Dear ${participant.firstName},</p>
                 <p>You have successfully canceled your RSVP for the event <strong>${event.title}</strong>.</p>
                 <p><strong>Event Details:</strong></p>
                 <ul>
                     <li>Date: ${event.date}</li>
                     <li>Time: ${event.startTime} - ${event.endTime} (EST)</li>
                 </ul>
                 <p>We hope to see you at our future events.</p>`
            );
        }

        res.status(200).json({ message: "RSVP canceled successfully." });
    } catch (error) {
        next(error);
    }
};

// Get Ticket for In-Person Event
export const getTicket = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        const currentDateTime = new Date();
        const eventEndDateTime = new Date(`${event.date}T${event.endTime}:00Z`);
        if (currentDateTime >= eventEndDateTime) {
            return res.status(400).json({ message: "Tickets are no longer accessible for past events." });
        }

        const rsvp = await RSVP.findOne({ eventId, participantId: req.user.id, status: "active" });
        if (!rsvp) {
            return res.status(404).json({ message: "No active RSVP found for this event." });
        }

        if (!rsvp.ticket) {
            return res.status(400).json({ message: "Ticket not available for this event." });
        }

        res.status(200).json({ ticket: rsvp.ticket });
    } catch (error) {
        next(error); // Pass error to centralized handler
    }
};

// Count Participants for an Event
export const countParticipants = async (req, res, next) => {
    try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        const count = event.rsvpList.filter((entry) => entry.status === "active").length;

        res.status(200).json({ message: `Total participants: ${count}`, count });
    } catch (error) {
        next(error); // Pass error to centralized handler
    }
};

export const getEventAttendees = async (req, res, next) => {
    try {
        const { eventId } = req.params;
        if (!eventId) {
            return res.status(400).json({ message: "Event ID is required." });
        }
        const event = await Event.findById(eventId).populate('rsvpList.participantId', 'firstName lastName email');
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }
        const attendees = event.rsvpList
            .filter(rsvp => rsvp.status === 'active')
            .map(rsvp => ({
                name: `${rsvp.participantId.firstName} ${rsvp.participantId.lastName}`,
                email: rsvp.participantId.email,
                status: rsvp.status
            }));
        res.status(200).json({ attendees });
    } catch (error) {
        next(error);
    }
};
