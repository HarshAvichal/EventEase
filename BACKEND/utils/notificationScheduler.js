import cron from "node-cron";
import Event from "../models/Event.js";
import RSVP from "../models/Rsvp.js";
import User from "../models/User.js";
import { sendEmail } from "./emailSender.js";

// All event times are assumed to be stored in UTC (date, startTime, endTime)
// All comparisons and scheduling are done in UTC

// Helper to get current UTC date and time strings
function getCurrentUTCStrings() {
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentTime = now.toISOString().split("T")[1].split(".")[0]; // HH:MM:SS
    return { currentDate, currentTime };
}

// Function to schedule reminder emails
export const scheduleReminders = () => {
    // Run the job every hour to check for events happening 24 hours later (UTC)
    cron.schedule("0 * * * *", async () => {
        // Fetch events happening 24 hours later (UTC)
        const events = await Event.find({
            date: reminderDate,
            startTime: { $gte: reminderStartTime, $lt: reminderEndTime },
        });

        for (const event of events) {
            // Only send reminders to RSVPs where reminderSent is false
            const rsvpDetails = await RSVP.find({ eventId: event._id, status: "active", reminderSent: false }).populate("participantId");
            for (const rsvp of rsvpDetails) {
                const participant = rsvp.participantId;
                if (participant) {
                    // Check if the event's start time is still in the future and within the 24-25 hour window
                    const now = new Date();
                    const eventStartDateTime = new Date(`${event.date}T${event.startTime}Z`);
                    const diffMs = eventStartDateTime - now;
                    const diffHours = diffMs / (1000 * 60 * 60);
                    if (diffHours < 24 || diffHours > 25) {
                        // Out of window, mark as sent to avoid retrying
                        rsvp.reminderSent = true;
                        await rsvp.save();
                        continue;
                    }
                    let retries = 3;
                    while (retries > 0) {
                        try {
                            await sendEmail(
                                participant.email,
                                `Reminder: Upcoming Event \"${event.title}\"`,
                                `<p>Dear ${participant.firstName},</p>
                                 <p>This is a reminder for the upcoming event <strong>${event.title}</strong>.</p>
                                 <p><strong>Event Details:</strong></p>
                                 <ul>
                                     <li>Date: ${event.date}</li>
                                     <li>Time: ${event.startTime} - ${event.endTime} (UTC)</li>
                                 </ul>
                                 <p>Join using the meeting link: <a href="${event.meetingLink}">${event.meetingLink}</a></p>
                                 <p>We look forward to seeing you there!</p>`
                            );
                            // Mark reminder as sent for this RSVP
                            rsvp.reminderSent = true;
                            await rsvp.save();
                            break;
                        } catch (emailError) {
                            retries--;
                            console.error(`Failed to send email to ${participant.email}. Retries left: ${retries}`, emailError.message);
                        }
                    }
                }
            }
        }
    });

    // Run the job every minute to notify participants when events start (UTC)
    cron.schedule("* * * * *", async () => {
        // Fetch events that are starting now and have not ended (UTC)
        const events = await Event.find({
            date: currentDate,
            startTime: { $lte: currentTime },
            endTime: { $gte: currentTime },
            status: "upcoming",
        });
        for (const event of events) {
            // Notify organizer if not already notified
            if (!event.organizerLiveNotified) {
                const organizer = await User.findById(event.organizerId);
                if (organizer && organizer.email) {
                    try {
                        await sendEmail(
                            organizer.email,
                            `Your Event is Now Live: ${event.title}`,
                            `<p>Dear ${organizer.firstName},</p>
                             <p>Your event <strong>${event.title}</strong> is now live!</p>
                             <p>Meeting Link: <a href="${event.meetingLink}">${event.meetingLink}</a></p>
                             <p>Best of luck with your event!</p>`
                        );
                        event.organizerLiveNotified = true;
                        await event.save();
                    } catch (err) {
                        console.error(`Failed to send live notification to organizer ${organizer.email}:`, err.message);
                    }
                }
            }
            const rsvpDetails = await RSVP.find({ eventId: event._id, status: "active" }).populate("participantId");
            for (const rsvp of rsvpDetails) {
                const participant = rsvp.participantId;
                if (participant) {
                    let retries = 3;
                    while (retries > 0) {
                        try {
                            await sendEmail(
                                participant.email,
                                `Event Now Live: ${event.title}`,
                                `<p>Dear ${participant.firstName},</p>
                                 <p>The event <strong>${event.title}</strong> is now live!</p>
                                 <p>Join using the meeting link: <a href="${event.meetingLink}">${event.meetingLink}</a></p>
                                 <p>We hope you enjoy the event!</p>`
                            );
                            break;
                        } catch (emailError) {
                            retries--;
                            console.error(`Failed to send live event notification to ${participant.email}. Retries left: ${retries}`, emailError.message);
                        }
                    }
                }
            }
            event.status = "live";
            await event.save();
        }
    });

    // Run the job every minute to move live events to completed (UTC)
    cron.schedule("* * * * *", async () => {
        // Fetch live events that have ended (UTC)
        const liveEvents = await Event.find({
            date: currentDate,
            endTime: { $lt: currentTime },
            status: "live",
        });
        for (const event of liveEvents) {
            event.status = "completed";
            await event.save();
        }
    });
};
