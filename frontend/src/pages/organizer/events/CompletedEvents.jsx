import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Grid,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideocamIcon from '@mui/icons-material/Videocam'; // Using VideocamIcon for consistency
import EventIcon from '@mui/icons-material/Event';
import EventDetailModal from '../../../components/events/EventDetailModal';
import FeedbackModal from '../../../components/events/FeedbackModal';
import dayjs from 'dayjs';

function CompletedEvents() {
  const { user, authAxios } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [feedbackEvent, setFeedbackEvent] = useState(null);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    const fetchCompletedEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError("Authentication token not found.");
          setIsLoading(false);
          return;
        }
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/organizer/completed`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Filter events as completed using backend computedStatus
        const completedEvents = (response.data.events || []).filter(event => event.computedStatus === 'completed');
        setEvents(completedEvents);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch completed events.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    if (user && user.role === 'organizer') {
      fetchCompletedEvents();
    }
  }, [user]);

  const handleCardClick = (eventId) => {
    setSelectedEventId(eventId);
  };

  const handleCloseModal = () => {
    setSelectedEventId(null);
  };

  const handleClickDelete = (eventId, eventTitle) => {
    setEventToDelete({ _id: eventId, title: eventTitle });
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setEventToDelete(null);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    handleCloseConfirmDialog();

    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/${eventToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(`Event "${eventToDelete.title}" deleted successfully!`);
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventToDelete._id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete event.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setEventToDelete(null);
    }
  };

  if (!user || user.role !== 'organizer') {
    return <Typography color="error" sx={{ textAlign: 'center', py: 8 }}>Access Denied: You must be an organizer to view completed events.</Typography>;
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading completed events...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Typography color="error" sx={{ textAlign: 'center', py: 8 }}>Error: {error}</Typography>;
  }

  return (
    <Fragment>
      <Box sx={{ p: 3, backgroundColor: 'white', borderRadius: '8px', boxShadow: 3 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}>
          Your Completed Events
        </Typography>
        {events.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No completed events found.
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {events.map(event => (
              <Grid item key={event._id} xs={12} sm={6} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 6,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.02)' },
                  }}
                  onClick={() => handleCardClick(event._id)}
                >
                  {event.thumbnail ? (
                    <CardMedia
                      component="img"
                      height="220"
                      image={event.thumbnail}
                      alt={event.title}
                      sx={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 220,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#e0e0e0',
                        color: '#616161',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        px: 2,
                      }}
                    >
                      No Image Available
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography variant="h6" component="div" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e', fontSize: '1.2rem', lineHeight: 1.3 }}>
                      {event.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, color: '#555' }}>
                      <EventIcon sx={{ mr: 1, fontSize: '1rem' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                        {dayjs(event.date).format('ddd, MMM D, YYYY')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: '#555' }}>
                      <AccessTimeIcon sx={{ mr: 1, fontSize: '1rem' }} />
                      <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                        {event.startTime} - {event.endTime}
                      </Typography>
                    </Box>
                    {event.computedStatus === 'completed' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: '#d32f2f' }}>
                        <VideocamIcon sx={{ mr: 1, fontSize: '1rem' }} />
                        <Typography variant="body2" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                          Event has ended
                        </Typography>
                      </Box>
                    ) : (
                      event.meetingLink && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: '#555' }}>
                          <VideocamIcon sx={{ mr: 1, fontSize: '1rem' }} />
                          <Typography variant="body2" component="a" href={event.meetingLink} target="_blank" rel="noopener noreferrer" sx={{ color: 'blue.600', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { textDecoration: 'underline' } }}>
                            View Link
                          </Typography>
                        </Box>
                      )
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', fontSize: '0.85rem' }}>
                      {event.description || 'No description provided.'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 1 }}>
                      <Button variant="outlined" size="small" sx={{ color: '#1a237e', borderColor: '#1a237e', '&:hover': { backgroundColor: '#e8eaf6' } }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setFeedbackEvent(event);
                        }}
                      >
                        View Feedback
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClickDelete(event._id, event.title);
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          open={Boolean(selectedEventId)}
          onClose={handleCloseModal}
        />
      )}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {eventToDelete && `Are you sure you want to delete the event: "${eventToDelete.title}"? This action cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
      <FeedbackModal
        open={!!feedbackEvent}
        onClose={() => setFeedbackEvent(null)}
        event={feedbackEvent}
        participantId={null} // Organizer, so no feedback form
        authAxios={authAxios}
        attendedCount={feedbackEvent?.attendedCount}
      />
    </Fragment>
  );
}

export default CompletedEvents; 