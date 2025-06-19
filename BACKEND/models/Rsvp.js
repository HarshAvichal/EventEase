import mongoose from 'mongoose';

const rsvpSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
        required: true
    },
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["active", "canceled"], // Tracks if RSVP is active or canceled
        default: "active"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    reminderSent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.model('RSVP', rsvpSchema);
