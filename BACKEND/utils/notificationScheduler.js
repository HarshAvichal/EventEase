import cron from "node-cron";
import Event from "../models/Event.js";
import RSVP from "../models/Rsvp.js";
import User from "../models/User.js";
import { sendEmail, getBrandedEmailTemplate } from "./emailSender.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

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
    // Run the job every hour to send 24-hour reminders (UTC)
    cron.schedule("0 * * * *", async () => {
        const { currentDate, currentTime } = getCurrentUTCStrings();
        
        // Find events starting in the next 24-25 hours (UTC)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split("T")[0];
        
        const events = await Event.find({
            $or: [
                { date: { $gt: currentDate, $lt: tomorrowDate } }, // Events on future dates
                {
                    date: tomorrowDate, // Events tomorrow
                    startTime: { $lte: currentTime }, // and start time is now or earlier (for 24h reminder)
                },
            ],
            status: { $ne: "canceled" },
        });

        for (const event of events) {
            const rsvps = await RSVP.find({
                eventId: event._id,
                status: "active",
                reminderSent: false,
            });

            for (const rsvp of rsvps) {
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
                        const participant = await User.findById(rsvp.participantId);
                        if (participant) {
                            // Convert UTC event time to America/New_York (EST) for the email
                            const estDateTime = dayjs.utc(`${event.date}T${event.startTime}`).tz('America/New_York');
                            const formattedDate = estDateTime.format("MMMM D, YYYY");
                            const formattedTime = estDateTime.format("h:mm A z");
                            
                            await sendEmail(
                                participant.email,
                                `Event Reminder: ${event.title}`,
                                getBrandedEmailTemplate(
                                  `Event Reminder: ${event.title}`,
                                  `<p style='color:#333;'>Dear <b>${participant.firstName}</b>,</p>
                                   <p style='color:#333;'>This is a friendly reminder that the event <strong>${event.title}</strong> is scheduled for <strong>${formattedDate}</strong> at <strong>${formattedTime}</strong>.</p>
                                   <p style='color:#333;'>Please join the meeting using the link provided in the event details.</p>
                                   <p style='color:#888;'>We look forward to seeing you there!</p>`
                                )
                            );
                            rsvp.reminderSent = true;
                            await rsvp.save();
                            break;
                        }
                    } catch (error) {
                        console.error(`Failed to send reminder email (attempt ${4 - retries}/3):`, error);
                        retries--;
                        if (retries === 0) {
                            console.error(`Failed to send reminder email after 3 attempts for event ${event._id}`);
                        }
                    }
                }
            }
        }
    });

    // Run the job every minute to move upcoming events to live (UTC)
    cron.schedule("* * * * *", async () => {
        const { currentDate, currentTime } = getCurrentUTCStrings();
        
        // Find upcoming events that should now be live (UTC)
        const upcomingEvents = await Event.find({
            date: currentDate,
            startTime: { $lte: currentTime },
            endTime: { $gt: currentTime },
            status: "upcoming",
        });
        
        for (const event of upcomingEvents) {
            event.status = "live";
            await event.save();
            
            // Notify organizer that event is live
            if (!event.organizerLiveNotified) {
                try {
                    const organizer = await User.findById(event.organizerId);
                    if (organizer) {
                        await sendEmail(
                            organizer.email,
                            `Your Event is Live: ${event.title}`,
                            getBrandedEmailTemplate(
                              `Your Event is Live: ${event.title}`,
                              `<p style='color:#333;'>Dear <b>${organizer.firstName}</b>,</p>
                               <p style='color:#333;'>Your event <strong>${event.title}</strong> is now live!</p>
                               <p style='color:#333;'>Participants can join using the meeting link: <a href="${event.meetingLink}">${event.meetingLink}</a></p>
                               <p style='color:#888;'>Good luck with your event!</p>`
                            )
                        );
                        event.organizerLiveNotified = true;
                        await event.save();
                    }
                } catch (error) {
                    console.error(`Failed to notify organizer about live event ${event._id}:`, error);
                }
            }
        }
    });

    // Run the job every minute to move live events to completed (UTC)
    cron.schedule("* * * * *", async () => {
        const { currentDate, currentTime } = getCurrentUTCStrings();
        
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
