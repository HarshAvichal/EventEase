import Feedback from '../models/Feedback.js';
import User from '../models/User.js';

// POST /api/v1/feedback/:eventId
export const createFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const participantId = req.user.id;
    const { rating, comment } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required.' });
    }
    // Upsert: only one feedback per participant per event
    const feedback = await Feedback.findOneAndUpdate(
      { eventId, participantId },
      { rating, comment, createdAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ message: 'Feedback submitted.', feedback });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/feedback/:eventId
export const getEventFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const feedback = await Feedback.find({ eventId })
      .populate('participantId', 'firstName lastName')
      .sort({ createdAt: -1 });
    const feedbackList = feedback.map(fb => ({
      rating: fb.rating,
      comment: fb.comment,
      participantId: fb.participantId._id.toString(),
      participantName: fb.participantId.firstName + ' ' + fb.participantId.lastName,
      createdAt: fb.createdAt,
    }));
    res.status(200).json({ feedback: feedbackList });
  } catch (error) {
    next(error);
  }
}; 