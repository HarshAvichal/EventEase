import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        date: {
            type: String,
            required: true,
            match: /^\d{4}-\d{2}-\d{2}$/,
        },
        startTime: {
            type: String,
            required: true,
            match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
        },
        endTime: {
            type: String,
            required: true,
            match: /^([0-1]\d|2[0-3]):([0-5]\d)$/,
        },
        meetingLink: {
            type: String,
            required: true,
            trim: true,
            validate: {
                validator: function (value) {
                    return value.startsWith("https://meet.jit.si/");
                },
                message: "Invalid meeting link format. Must be a valid Jitsi link.",
            },
        },
        organizerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        thumbnail: {
            type: String,
            default: 'https://via.placeholder.com/300x200?text=No+Thumbnail',
        },
        rsvpList: [
            {
                participantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                status: {
                    type: String,
                    enum: ["active", "canceled"],
                    default: "active",
                },
            },
        ],
        status: {
            type: String,
            enum: ["upcoming", "live", "completed", "canceled"],
            default: "upcoming",
        },
        organizerLiveNotified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
        toJSON: { virtuals: true }, // Include virtuals when converting to JSON
        toObject: { virtuals: true }, // Include virtuals when converting to Objects
    }
);

// Virtual field for computed status
// Use local time for all calculations
eventSchema.virtual('computedStatus').get(function () {
    const now = new Date();
    const startDateTime = new Date(`${this.date}T${this.startTime}`); // Local time
    const endDateTime = new Date(`${this.date}T${this.endTime}`);     // Local time

    if (this.status === 'canceled') {
        return 'canceled';
    } else if (now < startDateTime) {
        return 'upcoming';
    } else if (now >= startDateTime && now <= endDateTime) {
        return 'live';
    } else if (now > endDateTime) {
        return 'completed';
    }
    return 'unknown';
});

export default mongoose.model('Event', eventSchema);
