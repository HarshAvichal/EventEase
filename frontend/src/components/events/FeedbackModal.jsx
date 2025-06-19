import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField, CircularProgress, Tabs, Tab, Rating, List, ListItem, ListItemText, Divider } from '@mui/material';
import { FaUsers } from 'react-icons/fa';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
  outline: 'none',
};

const FeedbackModal = ({ open, onClose, event, participantId, authAxios }) => {
  const [tab, setTab] = useState(0); // 0: Give Feedback, 1: View Feedback
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myFeedback, setMyFeedback] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isOrganizerView = !participantId;

  useEffect(() => {
    if (!event || !open) return;
    setLoading(true);
    setError('');
    // Fetch all feedback for this event
    authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/feedback/${event._id || event.id}`)
      .then(res => {
        setFeedbackList(res.data.feedback || []);
        // Check if current user has already submitted feedback
        const mine = (res.data.feedback || []).find(fb => fb.participantId === participantId);
        setMyFeedback(mine || null);
        if (mine) {
          setRating(mine.rating);
          setComment(mine.comment);
        } else {
          setRating(0);
          setComment('');
        }
      })
      .catch(() => setFeedbackList([]))
      .finally(() => setLoading(false));
  }, [event, open, participantId, authAxios]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await authAxios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/feedback/${event._id || event.id}`, { rating, comment });
      setMyFeedback({ rating, comment, participantId });
      setTab(1); // Switch to view feedback
      // Refetch feedback list
      const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/feedback/${event._id || event.id}`);
      setFeedbackList(res.data.feedback || []);
    } catch (err) {
      setError('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          Feedback for {event?.title}
        </Typography>
        {isOrganizerView && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FaUsers style={{ color: '#1976d2', marginRight: 8 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
              {event?.registrationCount || 0} Attended
            </Typography>
          </Box>
        )}
        <Tabs value={isOrganizerView ? 1 : tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          {!isOrganizerView && <Tab label="Give Feedback" />}
          <Tab label="View Feedback" />
        </Tabs>
        {tab === 0 && !isOrganizerView && (
          myFeedback ? (
            <Typography color="success.main" sx={{ mb: 2 }}>You have already submitted feedback for this event.</Typography>
          ) : (
            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 2 }}>
                <Typography component="legend">Rating</Typography>
                <Rating
                  name="rating"
                  value={rating}
                  onChange={(_, newValue) => setRating(newValue)}
                  size="large"
                  required
                />
              </Box>
              <TextField
                label="Comment"
                multiline
                minRows={3}
                fullWidth
                value={comment}
                onChange={e => setComment(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              {error && <Typography color="error" sx={{ mb: 1 }}>{error}</Typography>}
              <Button type="submit" variant="contained" color="primary" disabled={submitting || !rating || !comment} fullWidth>
                {submitting ? <CircularProgress size={24} /> : 'Submit Feedback'}
              </Button>
            </form>
          )
        )}
        {(tab === 1 || isOrganizerView) && (
          loading ? <CircularProgress /> : (
            <List>
              {feedbackList.length === 0 ? (
                <Typography color="text.secondary">No feedback yet.</Typography>
              ) : feedbackList.map((fb, idx) => (
                <React.Fragment key={idx}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={<span><Rating value={fb.rating} readOnly size="small" /> {fb.comment}</span>}
                      secondary={fb.participantName || 'Anonymous'}
                    />
                  </ListItem>
                  {idx < feedbackList.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )
        )}
        <Button onClick={onClose} sx={{ mt: 2 }} fullWidth variant="outlined">Close</Button>
      </Box>
    </Modal>
  );
};

export default FeedbackModal; 