import Event from '../models/Event.js';
import RSVP from '../models/Rsvp.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { sendEmail } from '../utils/emailSender.js';
import { deleteCloudinaryImage } from '../utils/cloudinary.js';

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

        // Get current local time
        const currentDateTime = new Date(); // Local time
        // Construct event start and end datetime in local time
        const eventStartDateTime = new Date(`${date}T${normalizedStartTime}`);
        const eventEndDateTime = new Date(`${date}T${normalizedEndTime}`);
        // Debug logs for troubleshooting local time issues
        console.log('DEBUG - Event Creation:');
        console.log('  Server now:', currentDateTime.toString(), '| ISO:', currentDateTime.toISOString());
        console.log('  Received date:', date);
        console.log('  Received startTime:', normalizedStartTime);
        console.log('  Received endTime:', normalizedEndTime);
        console.log('  eventStartDateTime:', eventStartDateTime.toString(), '| ISO:', eventStartDateTime.toISOString());
        console.log('  eventEndDateTime:', eventEndDateTime.toString(), '| ISO:', eventEndDateTime.toISOString());
        // Check if the event is in the past (using local time comparison)
        if (eventStartDateTime < currentDateTime) {
            return res.status(400).json({ message: "Cannot create an event in the past." });
        }

        // Generate or validate meeting link
        let finalMeetingLink = meetingLink;
        if (!meetingLink) {
            const roomName = `EventEase-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
            finalMeetingLink = `https://meet.jit.si/${roomName}`;
        } else if (!meetingLink.startsWith("https://meet.jit.si/")) {
            return res.status(400).json({ message: "Meeting link must be a valid Jitsi link." });
        }

        // Check for conflicting events
        const conflict = await Event.findOne({
            organizerId: req.user.id,
            date,
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
            : 'https://via.placeholder.com/300x200?text=No+Thumbnail';

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
        // Use local date instead of UTC date
        const todayDate = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0');
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

        // Debug logs for server time and query
        console.log('DEBUG - getOrganizerUpcomingEvents:');
        console.log('  Server now:', now.toString(), '| ISO:', now.toISOString());
        console.log('  todayDate:', todayDate);
        console.log('  currentTime:', currentTime);

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
        // Use local date instead of UTC date
        const todayDate = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0');
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

        // Debug logs for server time and query
        console.log('DEBUG - getOrganizerCompletedEvents:');
        console.log('  Server now:', now.toString(), '| ISO:', now.toISOString());
        console.log('  todayDate:', todayDate);
        console.log('  currentTime:', currentTime);

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
        const events = await Event.find(query, "title date startTime endTime meetingLink status thumbnail description")
            .sort({ date: -1, endTime: -1 })
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


// Get All Events for Participants (Upcoming)
export const getParticipantUpcomingEvents = async (req, res, next) => {
    try {
        const now = new Date();
        // Use local date instead of UTC date
        const todayDate = now.getFullYear() + '-' +
          String(now.getMonth() + 1).padStart(2, '0') + '-' +
          String(now.getDate()).padStart(2, '0');
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

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
        console.log('DEBUG - Server now:', new Date().toString());
        console.log('DEBUG - getParticipantUpcomingEvents Query:', JSON.stringify(query, null, 2));
        console.log('DEBUG - currentTime:', currentTime, 'todayDate:', todayDate);

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

        // Append computedStatus to each event for frontend use if needed
        const eventsWithComputedStatus = events.map(event => ({
            ...event.toObject(),
            computedStatus: event.computedStatus // Access the virtual here
        }));

        res.status(200).json({
            metadata: {
                totalItems: events.length,
                totalPages: Math.ceil(events.length / limit),
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
            },
            events: eventsWithComputedStatus,
        });
    } catch (error) {
        next(error); // Pass error to centralized error handler
    }
};

// Get All Events for Participants (Completed)
export const getParticipantCompletedEvents = async (req, res, next) => {
    try {
        const now = new Date();
        const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

        const { type, page = 1, limit = 10 } = req.query; // Extract query parameters with defaults

        // Normalize the type filter (case-insensitive)
        const normalizedType = type ? type.toLowerCase() : null;

        const query = {
            $or: [
                { date: { $lt: todayDate } }, // Past dates
                {
                    date: todayDate, // Today
                    endTime: { $lte: currentTime },
                },
            ],
        };

        // Apply type filter if provided
        if (normalizedType) {
            query.type = normalizedType;
        }

        const totalItems = await Event.countDocuments(query); // Total number of matching events
        const events = await Event.find(query, "title date startTime endTime type status thumbnail description") // Project minimal fields
            .sort({ date: -1, endTime: -1 }) // Sort by date and endTime
            .skip((page - 1) * limit) // Skip documents for pagination
            .limit(parseInt(limit)); // Limit the number of documents

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
        next(error); // Pass error to centralized error handler
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
                const eventStartDateTime = new Date(`${event.date}T${event.startTime}:00Z`);
                const eventEndDateTime = new Date(`${event.date}T${event.endTime}:00Z`);

                if (currentDateTime < eventStartDateTime) {
                    if (!normalizedType || event.type === normalizedType) {
                        myUpcomingEvents.push({
                            id: event._id,
                            title: event.title,
                            date: event.date,
                            startTime: event.startTime,
                            endTime: event.endTime,
                            type: event.type,
                            status: "upcoming",
                            organizerId: event.organizerId,
                            thumbnail: event.thumbnail,
                            meetingLink: event.meetingLink,
                        });
                    }
                } else if (currentDateTime >= eventStartDateTime && currentDateTime <= eventEndDateTime) {
                    myLiveEvents.push({
                        id: event._id,
                        title: event.title,
                        date: event.date,
                        startTime: event.startTime,
                        endTime: event.endTime,
                        type: event.type,
                        status: "live",
                        organizerId: event.organizerId,
                        thumbnail: event.thumbnail,
                        meetingLink: event.meetingLink,
                    });
                } else if (currentDateTime > eventEndDateTime) {
                    if (!normalizedType || event.type === normalizedType) {
                        myCompletedEvents.push({
                            id: event._id,
                            title: event.title,
                            date: event.date,
                            startTime: event.startTime,
                            endTime: event.endTime,
                            type: event.type,
                            status: "completed",
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
                            `<p>Dear ${participant.firstName},</p>
                             <p>We regret to inform you that the event <strong>${event.title}</strong>, scheduled for 
                             <strong>${event.date}</strong> from <strong>${event.startTime}</strong> to <strong>${event.endTime}</strong>, 
                             has been canceled by the organizer.</p>
                             <p>We apologize for the inconvenience caused.</p>`
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
        const { id } = req.params;
        const { title, description, date, startTime, endTime, meetingLink, thumbnail } = req.body;

        // Find the event
        const event = await Event.findById(id).populate('rsvpList.participantId', 'email firstName lastName');
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }

        // Check if user is the organizer
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "You are not authorized to update this event." });
        }

        // Store old date/time for comparison
        const oldDate = event.date;
        const oldStartTime = event.startTime;
        const oldEndTime = event.endTime;

        // If there's a new thumbnail file, delete the old one
        if (req.file && event.thumbnail) {
            const publicId = event.thumbnail.split('/').slice(-1)[0].split('.')[0];
            await deleteCloudinaryImage(publicId);
        }

        // Update event fields
        const updateData = {
            ...(title && { title }),
            ...(description && { description }),
            ...(date && { date }),
            ...(startTime && { startTime }),
            ...(endTime && { endTime }),
            ...(meetingLink && { meetingLink }),
            ...(req.file && { thumbnail: req.file.path }),
            ...(thumbnail && { thumbnail }), // Accept thumbnail URL from body
        };

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('rsvpList.participantId', 'email firstName lastName');

        // Notify participants if date or time changed
        if (
            (date && date !== oldDate) ||
            (startTime && startTime !== oldStartTime) ||
            (endTime && endTime !== oldEndTime)
        ) {
            for (const rsvp of event.rsvpList) {
                if (rsvp.status === 'active' && rsvp.participantId?.email) {
                    sendEmail(
                        rsvp.participantId.email,
                        `Event Updated: ${event.title}`,
                        `<p>Dear ${rsvp.participantId.firstName},</p><p>The event <strong>${event.title}</strong> you registered for has been updated.</p><p><strong>New Schedule:</strong><br>Date: ${date || oldDate}<br>Time: ${(startTime || oldStartTime)} - ${(endTime || oldEndTime)}</p><p>Please check the event details for more information.</p>`
                    );
                }
            }
        }

        res.status(200).json({
            message: "Event updated successfully",
            event: updatedEvent
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
        const { id } = req.params;
        // Validate Event ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid event ID." });
        }
        // Fetch the Event
        const event = await Event.findById(id).populate('rsvpList.participantId', 'email firstName lastName');
        if (!event) {
            return res.status(404).json({ message: "Event not found." });
        }
        // Only organizer can cancel
        if (event.organizerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the organizer can cancel this event." });
        }
        // Set status to canceled
        event.status = 'canceled';
        await event.save();
        // Notify all participants
        for (const rsvp of event.rsvpList) {
            if (rsvp.status === 'active' && rsvp.participantId?.email) {
                sendEmail(
                    rsvp.participantId.email,
                    `Event Canceled: ${event.title}`,
                    `<p>Dear ${rsvp.participantId.firstName},</p><p>The event <strong>${event.title}</strong> scheduled for <strong>${event.date}</strong> from <strong>${event.startTime}</strong> to <strong>${event.endTime}</strong> has been canceled by the organizer.</p><p>We apologize for the inconvenience.</p>`
                );
            }
        }
        res.status(200).json({ message: 'Event canceled successfully.', event });
    } catch (error) {
        next(error);
    }
};
