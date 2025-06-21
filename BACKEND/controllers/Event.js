import Event from '../models/Event.js';
import RSVP from '../models/Rsvp.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { sendEmail, getBrandedEmailTemplate } from '../utils/emailSender.js';
import { deleteCloudinaryImage } from '../utils/cloudinary.js';
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

// Create Event
export const createEvent = async (req, res, next) => {
    try {
        const { title, description, date, startTime, endTime, meetingLink } = req.body;

        // Only organizers can create events
        if (req.user.role !== "organizer") {
            return res.status(403).json({ message: "Only organizers can create events." });
        }

        // Validate required fields
        if (!title || !date || !startTime || !endTime) {
            return res.status(400).json({ message: "Title, date, startTime, and endTime are required." });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD (e.g., 2024-12-31)." });
        }

        // Normalize time input
        const normalizeTime = (time) => {
            const [hours, minutes] = time.split(':').map(Number);
            if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                throw new Error(`Invalid time format: ${time}. Use HH:mm (e.g., 13:00 or 1:00).`);
            }
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        };

        let normalizedStartTime, normalizedEndTime;

        try {
            normalizedStartTime = normalizeTime(startTime);
            normalizedEndTime = normalizeTime(endTime);
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }

        // Logical validation: startTime < endTime
        if (normalizedStartTime >= normalizedEndTime) {
            return res.status(400).json({ message: "End time must be after start time." });
        }

        // Convert local date/time to UTC for proper validation
        // Create a local datetime string and convert to UTC
        const localDateTimeString = `${date}T${normalizedStartTime}:00`;
        const eventStartDateTime = new Date(localDateTimeString);
        const eventEndDateTime = new Date(`${date}T${normalizedEndTime}:00`);
        
        // Get current UTC time
        const currentDateTime = new Date();
        
        // Debug logs for troubleshooting UTC time issues
        console.log('DEBUG - Event Creation (UTC):');
        console.log('  Server now (UTC):', currentDateTime.toISOString());
        console.log('  Received date:', date);
        console.log('  Received startTime:', normalizedStartTime);
        console.log('  Received endTime:', normalizedEndTime);
        console.log('  eventStartDateTime (UTC):', eventStartDateTime.toISOString());
        console.log('  eventEndDateTime (UTC):', eventEndDateTime.toISOString());
        
        // Check if the event is in the past (using UTC comparison)
        if (eventStartDateTime <= currentDateTime) {
            return res.status(400).json({ message: "Event can't be in the past" });
        }

        // Generate or validate meeting link
        let finalMeetingLink = meetingLink;
        if (!meetingLink) {
            const roomName = `EventEase-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            finalMeetingLink = `https://meet.jit.si/${roomName}`;
        } else if (!meetingLink.startsWith("https://meet.jit.si/")) {
            return res.status(400).json({ message: "Meeting link must be a valid Jitsi link." });
        }

        // Check for conflicting events (ignore canceled events)
        const conflict = await Event.findOne({
            organizerId: req.user.id,
            date,
            status: { $ne: "canceled" }, // Ignore canceled events
            $or: [
                { startTime: { $lt: normalizedEndTime, $gte: normalizedStartTime } },
                { endTime: { $gt: normalizedStartTime, $lte: normalizedEndTime } },
                { startTime: { $lte: normalizedStartTime }, endTime: { $gte: normalizedEndTime } },
            ],
        });

        if (conflict) {
            return res.status(400).json({
                message: `You already have another event (${conflict.title}) scheduled on ${conflict.date} from ${conflict.startTime} to ${conflict.endTime}.`,
            });
        }

        // Get thumbnail URL from Cloudinary
        const thumbnail = req.file
            ? req.file.path.replace('/upload/', '/upload/w_300,h_200,c_fill/')
            : undefined;

        // Create the event
        const event = new Event({
            title,
            description,
            date,
            startTime: normalizedStartTime,
            endTime: normalizedEndTime,
            meetingLink: finalMeetingLink,
            organizerId: req.user.id,
            thumbnail,
            status: "upcoming",
        });

        await event.save();

        res.status(201).json({ message: "Event created successfully", event });
    } catch (error) {
        next(error);
    }
};


// Get All Events for Organizer (Upcoming) 
export const getOrganizerUpcomingEvents = async (req, res, next) => {
    try {
        const now = new Date();
        // Use UTC date and time for consistent timezone handling
        const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
        const currentTime = now.toISOString().split('T')[1].substring(0, 5); // HH:MM in UTC

        // Debug logs for server time and query
        console.log('DEBUG - getOrganizerUpcomingEvents (UTC):');
        console.log('  Server now (UTC):', now.toISOString());
        console.log('  todayDate (UTC):', todayDate);
        console.log('  currentTime (UTC):', currentTime);

        const { page = 1, limit = 10 } = req.query;

        const query = {
            organizerId: req.user.id,
            $or: [
                { date: { $gt: todayDate } }, // Events on future dates
                {
                    date: todayDate, // Events on today's date
                    startTime: { $gte: currentTime }, // and start time is now or later
                },
            ],
        };
        console.log('  Query:', JSON.stringify(query, null, 2));

        const totalItems = await Event.countDocuments(query);
        const events = await Event.find(query, "title date startTime endTime meetingLink status thumbnail description")
            .sort({ date: 1, startTime: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Log the date, startTime, and endTime for each event returned
        events.forEach(event => {
            console.log(`  Event: ${event.title} | date: ${event.date} | startTime: ${event.startTime} | endTime: ${event.endTime}`);
        });

        // Append computedStatus to each event for frontend use if needed
        const eventsWithComputedStatus = events.map(event => ({
            ...event.toObject(),
            computedStatus: event.computedStatus // Access the virtual here
        }));

        res.status(200).json({
            metadata: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
            },
            events: eventsWithComputedStatus,
        });
    } catch (error) {
        next(error);
    }
};

// Get All Events for Organizer (completed)
export const getOrganizerCompletedEvents = async (req, res, next) => {
    try {
        const now = new Date();
        // Use UTC date and time for consistent timezone handling
        const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
        const currentTime = now.toISOString().split('T')[1].substring(0, 5); // HH:MM in UTC

        // Debug logs for server time and query
        console.log('DEBUG - getOrganizerCompletedEvents (UTC):');
        console.log('  Server now (UTC):', now.toISOString());
        console.log('  todayDate (UTC):', todayDate);
        console.log('  currentTime (UTC):', currentTime);

        const { page = 1, limit = 10 } = req.query;

        const query = {
            organizerId: req.user.id,
            $or: [
                { date: { $lt: todayDate } }, // Events on past dates
                {
                    date: todayDate, // Events on today's date
                    endTime: { $lte: currentTime }, // and end time is now or earlier
                },
            ],
        };
        console.log('  Query:', JSON.stringify(query, null, 2));

        const totalItems = await Event.countDocuments(query);
        const events = await Event.find(query, "title date startTime endTime meetingLink status thumbnail description rsvpList")
            .sort({ date: -1, endTime: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        // Log the date, startTime, and endTime for each event returned
        events.forEach(event => {
            console.log(`  Event: ${event.title} | date: ${event.date} | startTime: ${event.startTime} | endTime: ${event.endTime}`);
        });

        // Append computedStatus and attendedCount to each event for frontend use if needed
        const eventsWithComputedStatus = events.map(event => {
            const obj = event.toObject();
            obj.computedStatus = event.computedStatus; // Access the virtual here
            obj.attendedCount = (event.rsvpList || []).filter(rsvp => rsvp.status === 'active').length;
            return obj;
        });

        res.status(200).json({
            metadata: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
            },
            events: eventsWithComputedStatus,
        });
    } catch (error) {
        next(error);
    }
};


// Get All Events for Participants (Upcoming)
export const getParticipantUpcomingEvents = async (req, res, next) => {
    try {
        const now = new Date();
        // Use UTC date and time for consistent timezone handling
        const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD in UTC
        const currentTime = now.toISOString().split('T')[1].substring(0, 5); // HH:MM in UTC

        const { type, page = 1, limit = 10 } = req.query; // Extract query parameters with defaults

        // Normalize the type filter (case-insensitive)
        const normalizedType = type ? type.toLowerCase() : null;

        const query = {
            $or: [
                { date: { $gt: todayDate } }, // Future dates
                {
                    date: todayDate, // Today
                    startTime: { $gte: currentTime },
                },
            ],
        };
        console.log('DEBUG - Server now (UTC):', now.toISOString());
        console.log('DEBUG - getParticipantUpcomingEvents Query (UTC):', JSON.stringify(query, null, 2));
        console.log('DEBUG - currentTime (UTC):', currentTime, 'todayDate (UTC):', todayDate);

        const events = await Event.find(query, "title date startTime endTime type status thumbnail description organizerId")
            .populate('organizerId', 'firstName lastName')
            .sort({ date: 1, startTime: 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        console.log('DEBUG - Events returned:', events.map(e => ({
          title: e.title,
          date: e.date,
          startTime: e.startTime,
          endTime: e.endTime,
          status: e.status
        })));

        // Append computedStatus and registrationCount to each event
        const eventsWithDetails = await Promise.all(events.map(async (event) => {
            const registrationCount = await RSVP.countDocuments({ eventId: event._id, status: 'active' });
            return {
                ...event.toObject(),
                computedStatus: event.computedStatus,
                registrationCount,
            };
        }));

        res.status(200).json({
            metadata: {
                totalItems: eventsWithDetails.length,
                totalPages: Math.ceil(eventsWithDetails.length / limit),
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
            },
            events: eventsWithDetails,
        });
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
};

// Get All Events for Participants (Completed)
export const getParticipantCompletedEvents = async (req, res, next) => {
    try {
        const now = new Date();
        const todayDate = now.toISOString().split('T')[0];
        const currentTime = now.toISOString().split('T')[1].substring(0, 5);

        const rsvps = await RSVP.find({ participantId: req.user.id }).select('eventId');
        const eventIds = rsvps.map(rsvp => rsvp.eventId);

        const completedEvents = await Event.find({
            _id: { $in: eventIds },
            $or: [
                { date: { $lt: todayDate } },
                { date: todayDate, endTime: { $lte: currentTime } },
            ],
        }).select('_id');
        
        const completedEventIds = completedEvents.map(event => event._id);

        const { page = 1, limit = 10 } = req.query;

        const events = await Event.find({ _id: { $in: completedEventIds } })
            .populate('organizerId', 'firstName lastName')
            .sort({ date: -1, endTime: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
            
        const totalItems = await RSVP.countDocuments({
            participantId: req.user.id,
            eventId: { $in: completedEventIds }
        });

        res.status(200).json({
            metadata: {
                totalItems,
                totalPages: Math.ceil(totalItems / limit),
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
            },
            events,
        });
    } catch (error) {
        next(error);
    }
};


// Get All Events for Participants (Upcoming + Completed (rsvp'd))
export const getParticipantMyEvents = async (req, res, next) => {
    try {
        const currentDateTime = new Date();
        const { type } = req.query; // Extract the type filter from query parameters

        // Normalize the type filter (case-insensitive)
        const normalizedType = type ? type.toLowerCase() : null;

        // Fetch active RSVPs for the participant
        const myRSVPs = await RSVP.find({ participantId: req.user.id, status: "active" }).populate({ path: "eventId", populate: { path: "organizerId", select: "firstName lastName" } });

        // Separate upcoming, live, and completed events
        const myUpcomingEvents = [];
        const myLiveEvents = [];
        const myCompletedEvents = [];

        myRSVPs.forEach((rsvp) => {
            const event = rsvp.eventId;
            if (event) {
                // Skip canceled events
                if (event.status === 'canceled') return;
                // Use computedStatus for filtering
                const status = event.computedStatus || event.status;
                if (status === 'upcoming') {
                    if (!normalizedType || event.type === normalizedType) {
                        myUpcomingEvents.push({
                            id: event._id,
                            title: event.title,
                            date: event.date,
                            startTime: event.startTime,
                            endTime: event.endTime,
                            type: event.type,
                            status: 'upcoming',
                            organizerId: event.organizerId,
                            thumbnail: event.thumbnail,
                            meetingLink: event.meetingLink,
                        });
                    }
                } else if (status === 'live') {
                    myLiveEvents.push({
                        id: event._id,
                        title: event.title,
                        date: event.date,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        type: event.type,
                        status: 'live',
                        organizerId: event.organizerId,
                        thumbnail: event.thumbnail,
                        meetingLink: event.meetingLink,
                    });
                } else if (status === 'completed') {
                    if (!normalizedType || event.type === normalizedType) {
                        myCompletedEvents.push({
                            id: event._id,
                            title: event.title,
                            date: event.date,
                            startTime: event.startTime,
                            endTime: event.endTime,
                            type: event.type,
                            status: 'completed',
                            organizerId: event.organizerId,
                            thumbnail: event.thumbnail,
                            meetingLink: event.meetingLink,
                        });
                    }
                }
            }
        });

        res.status(200).json({
            myEvents: {
                upcoming: myUpcomingEvents,
                live: myLiveEvents,
                completed: myCompletedEvents,
            },
        });
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
};

// Get Event Details (Jitsi Link Visibility for Participants)
export const getEventDetails = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate event ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        // Fetch the event and populate relevant details
        const event = await Event.findById(id)
            .populate("organizerId", "firstName lastName email") // Populate organizer details
            .exec();

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        const currentDate = new Date();
        const currentDateString = currentDate.toISOString().split("T")[0];
        const currentTimeString = currentDate.toTimeString().split(" ")[0];

        // Count active RSVPs (registrations)
        const activeRSVPs = event.rsvpList.filter((rsvp) => rsvp.status === "active");
        const registrationCount = activeRSVPs.length;

        // Prepare the response object
        const response = event.toObject();
        response.registrationCount = registrationCount;
        response.thumbnail = event.thumbnail
            ? event.thumbnail.replace('/upload/', '/upload/w_300,h_200,c_fill/')
            : 'https://via.placeholder.com/300x200?text=No+Thumbnail';
        response.rsvpList = activeRSVPs.map(rsvp => ({ participantId: rsvp.participantId.toString() }));
        response.currentUserId = req.user.id;

        if (req.user.role === "organizer") {
            // Fetch RSVP details for organizers
            const rsvpDetails = await RSVP.find({ eventId: id, status: "active" }).populate("participantId", "firstName lastName email");
            response.rsvpList = rsvpDetails.map((rsvp) => ({
                participantName: `${rsvp.participantId.firstName} ${rsvp.participantId.lastName}`,
                email: rsvp.participantId.email,
                ticketUUID: rsvp.ticket || "N/A",
                joinedAt: rsvp.joinedAt.toLocaleString(),
            }));
        }
        // For participants, show the link if they have an active RSVP, otherwise hide it
        if (req.user.role === "participant") {
            const participantRSVP = activeRSVPs.find((rsvp) => rsvp.participantId.toString() === req.user.id);
            if (!participantRSVP) {
                response.meetingLink = "To get the link, you need to RSVP first.";
            } else {
                response.meetingLink = event.meetingLink;
            }
            // If the event is completed
            if (
                event.date < currentDateString ||
                (event.date === currentDateString && event.endTime < currentTimeString)
            ) {
                response.meetingLink = "This event has already ended.";
            }
        }

        res.status(200).json({ event: response });
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
};

// Delete Event (Notify Participants)
export const deleteEvent = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Validate Event ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }

        // 2. Fetch the Event
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        // 3. Verify Organizer Authorization
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Access denied. Only the organizer can delete this event." });
        }

        // 5. Notify Participants of Event Cancellation
        if (event.rsvpList.length > 0) {
            for (const rsvpEntry of event.rsvpList) {
                const participant = await User.findById(rsvpEntry.participantId);
                if (participant) {
                    // Send cancellation email
                    setTimeout(() => {
                        sendEmail(
                            participant.email,
                            `Event Cancellation: ${event.title}`,
                            getBrandedEmailTemplate(
                              `Event Canceled: ${event.title}`,
                              `<p style='color:#333;'>Dear <b>${participant.firstName}</b>,</p>
                               <p style='color:#333;'>We regret to inform you that the event <strong>${event.title}</strong>, scheduled for <strong>${event.date}</strong> from <strong>${event.startTime}</strong> to <strong>${event.endTime}</strong>, has been canceled by the organizer.</p>
                               <p style='color:#888;'>We apologize for the inconvenience caused.</p>`
                            )
                        );
                    }, 0);
                }
            }
        }

        // 6. Remove RSVPs Associated with the Event
        await RSVP.deleteMany({ eventId: id });

        // 7. Delete the Event
        await Event.findByIdAndDelete(id);

        res.status(200).json({ message: "Event deleted successfully, and all RSVPs for the event have been removed." });
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
};



// Search Events by Filters
export const searchEvents = async (req, res, next) => {
    try {
        // Initialize query object
        const query = {};

        // Fetch and Sort Events
        const events = await Event.find(query)
            .select('title description date startTime endTime meetingLink thumbnail status')
            .sort({ date: 1, startTime: 1 }); // Sort by date, then startTime (ascending)

        res.status(200).json({ events });
    } catch (error) {
        next(error);
    }
};

// Update Event
export const updateEvent = async (req, res, next) => {
    try {
        const eventId = req.params.id;
        const updates = req.body;
        const userId = req.user.id;

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        if (event.organizerId.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to update this event." });
        }

        // Keep track of what changed for notification purposes
        const changes = {};
        if (updates.date && updates.date !== event.date) changes.date = updates.date;
        if (updates.startTime && updates.startTime !== event.startTime) changes.startTime = updates.startTime;
        if (updates.endTime && updates.endTime !== event.endTime) changes.endTime = updates.endTime;

        // Find all RSVPs for this event
        const rsvps = await RSVP.find({ eventId });
        const participantIds = rsvps.map(r => r.participantId);
        const participants = await User.find({ '_id': { $in: participantIds } });

        // Update the event with the new details
        Object.assign(event, updates);
        await event.save();
        
        // Notify all registered participants about the update
        if (Object.keys(changes).length > 0) {
            const userTimezone = 'America/New_York';
            const formattedDate = dayjs.utc(event.date).tz(userTimezone).format("MMMM D, YYYY");
            const formattedStartTime = dayjs.utc(`${event.date}T${event.startTime}Z`).tz(userTimezone).format("h:mm A");
            const formattedEndTime = dayjs.utc(`${event.date}T${event.endTime}Z`).tz(userTimezone).format("h:mm A");

            const emailPromises = participants.map(participant => {
                return sendEmail(
                    participant.email,
                    `Event Updated: ${event.title}`,
                    getBrandedEmailTemplate(
                        `Event Updated: ${event.title}`,
                        `<p>Dear ${participant.firstName},</p>
                         <p>The event <b>${event.title}</b> you registered for has been updated.</p>
                         <p><b>New Schedule:</b></p>
                         <p>Date: ${formattedDate}</p>
                         <p>Time: ${formattedStartTime} - ${formattedEndTime} EST</p>
                         <p>Please check the event details for more information.</p>`
                    )
                );
            });
            await Promise.all(emailPromises);
        }

        res.status(200).json({
            message: "Event updated successfully",
            event,
        });
    } catch (error) {
        next(error);
    }
};

// New endpoint: Get All Events for Organizer (no filtering)
export const getOrganizerAllEvents = async (req, res, next) => {
    try {
        const events = await Event.find({ organizerId: req.user.id })
            .sort({ date: 1, startTime: 1 });
        const eventsWithComputedStatus = events.map(event => {
            const obj = event.toObject();
            obj.computedStatus = event.computedStatus;
            obj.thumbnail = obj.thumbnail
                ? obj.thumbnail.replace('/upload/', '/upload/w_300,h_200,c_fill/')
                : 'https://via.placeholder.com/300x200?text=No+Thumbnail';
            return obj;
        });
        res.status(200).json({ events: eventsWithComputedStatus });
    } catch (error) {
        next(error);
    }
};

export const cancelEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Only the organizer can cancel the event
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to cancel this event" });
        }

        event.status = 'canceled';
        await event.save();

        // Notify all registered participants
        const rsvps = await RSVP.find({ eventId: event._id, status: 'active' });
        const participantIds = rsvps.map(rsvp => rsvp.participantId);
        const participants = await User.find({ _id: { $in: participantIds } });

        // Format date and time in EST for the email
        const estDateTime = dayjs.utc(`${event.date}T${event.startTime}`).tz('America/New_York');
        const estDate = estDateTime.format('MMMM D, YYYY');
        const estTime = estDateTime.format('h:mm A z');

        for (const participant of participants) {
            await sendEmail(
                participant.email,
                `Event Canceled: ${event.title}`,
                getBrandedEmailTemplate(
                  `Event Canceled: ${event.title}`,
                  `<p>Dear ${participant.firstName},</p>
                   <p>We're writing to inform you that the event "<strong>${event.title}</strong>" scheduled for <strong>${estDate} at ${estTime}</strong> has been canceled by the organizer.</p>
                   <p>We apologize for any inconvenience this may cause.</p>`
                )
            );
        }

        res.status(200).json({ message: "Event canceled successfully" });
    } catch (error) {
        next(error);
    }
};


