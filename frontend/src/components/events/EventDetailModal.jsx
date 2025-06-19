import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, IconButton, CircularProgress, Grid, CardMedia, Button, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import VideocamIcon from '@mui/icons-material/Videocam';
import { FaUsers } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '95%', md: 800 },
  maxHeight: '90vh',
  bgcolor: 'background.paper',
  borderRadius: '8px',
  boxShadow: 24,
  p: 4,
  outline: 'none',
  overflowY: 'auto',
};

function EventDetailModal({ eventId, open, onClose }) {
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) {
        setEventDetails(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/details/${eventId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setEventDetails(response.data.event);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch event details.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="event-detail-modal-title"
      aria-describedby="event-detail-modal-description"
    >
      <Box sx={style}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ textAlign: 'center', py: 4 }}>
            Error: {error}
          </Typography>
        )}

        {eventDetails && !isLoading && (() => {
          const now = dayjs();
          const eventStart = dayjs(eventDetails.date + 'T' + eventDetails.startTime);
          const eventEnd = dayjs(eventDetails.date + 'T' + eventDetails.endTime);
          let status = 'upcoming';
          if (now.isAfter(eventEnd)) status = 'completed';
          else if (now.isAfter(eventStart) && now.isBefore(eventEnd)) status = 'live';
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {eventDetails.thumbnail && (
                  <CardMedia
                    component="img"
                    height="300"
                    image={eventDetails.thumbnail}
                    alt={eventDetails.title}
                    sx={{ borderRadius: '8px', objectFit: 'cover' }}
                  />
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 'bold', color: '#1a237e' }}>
                    {eventDetails.title}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CalendarTodayIcon sx={{ mr: 1, color: '#555' }} />
                  <Typography variant="body1" color="text.secondary">
                    {dayjs(eventDetails.date).format('dddd, MMMM D, YYYY')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTimeIcon sx={{ mr: 1, color: '#555' }} />
                  <Typography variant="body1" color="text.secondary">
                    {dayjs(eventDetails.date + 'T' + eventDetails.startTime).format('HH:mm')} - {dayjs(eventDetails.date + 'T' + eventDetails.endTime).format('HH:mm')}
                  </Typography>
                </Box>
                {/* Conditional rendering for meeting link based on computed status (now frontend computed) */}
                {status === 'completed' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <VideocamIcon sx={{ mr: 1, color: '#d32f2f' }} />
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                      Event has ended
                    </Typography>
                  </Box>
                ) : (
                  eventDetails.meetingLink && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <VideocamIcon sx={{ mr: 1, color: '#555' }} />
                        <Typography variant="body1" component="a" href={eventDetails.meetingLink} target="_blank" rel="noopener noreferrer" sx={{ color: 'blue.600', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                          Join Event
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 2 }}>
                        <FaUsers style={{ color: '#555', fontSize: 32, marginRight: 12 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 28, color: '#555' }}>
                          {eventDetails.registrationCount || 0}
                        </Typography>
                      </Box>
                    </>
                  )
                )}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2, fontWeight: 'bold', color: '#333' }}>
                  Details
                </Typography>
                <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.6 }}>
                  {eventDetails.description || 'No description available.'}
                </Typography>
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                  <Button variant="contained" onClick={onClose} sx={{ mr: 1, bgcolor: '#1a237e', '&:hover': { bgcolor: '#3949ab' } }}>
                      Close Preview
                  </Button>
                  {/* Add more action buttons here if needed, e.g., RSVP */}
              </Grid>
            </Grid>
          );
        })()}
      </Box>
    </Modal>
  );
}

export default EventDetailModal; 