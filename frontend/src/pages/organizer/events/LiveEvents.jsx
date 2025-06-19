import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useEvents } from '../../../context/EventsContext';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import VideocamIcon from '@mui/icons-material/Videocam';
import EventDetailModal from '../../../components/events/EventDetailModal';
import EditEventModal from '../../../components/events/EditEventModal';
import dayjs from 'dayjs';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

function LiveEvents() {
  const { user } = useAuth();
  const { events, isLoading, error, refetchEvents } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [eventToCancel, setEventToCancel] = useState(null);

  // Filter events for live using backend computedStatus
  const liveEvents = events.filter(event => event.computedStatus === 'live');

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
      setDeleteLoading(true);
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/${eventToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(`Event "${eventToDelete.title}" deleted successfully!`);
      await refetchEvents(); // Refresh the events list from context
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete event.';
      toast.error(errorMessage);
    } finally {
      setDeleteLoading(false);
      setEventToDelete(null);
    }
  };

  // Edit modal handlers
  const handleEditClick = (event) => {
    setEventToEdit(event);
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setEventToEdit(null);
  };

  const handleEventUpdate = async (updatedEvent) => {
    await refetchEvents(); // Re-fetch all events after edit
  };

  // Cancel event handler
  const handleClickCancel = (eventId, eventTitle) => {
    setEventToCancel({ _id: eventId, title: eventTitle });
    setOpenCancelDialog(true);
  };

  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
    setEventToCancel(null);
  };

  const confirmCancel = async () => {
    if (!eventToCancel) return;
    handleCloseCancelDialog();
    try {
      setCancelLoading(true);
      const token = localStorage.getItem('accessToken');
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/${eventToCancel._id}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(`Event "${eventToCancel.title}" canceled successfully!`);
      await refetchEvents();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to cancel event.';
      toast.error(errorMessage);
    } finally {
      setCancelLoading(false);
      setEventToCancel(null);
    }
  };

  if (!user || user.role !== 'organizer') {
    return <p className="text-red-500">Access Denied: You must be an organizer to view live events.</p>;
  }

  if (isLoading) {
    return <div className="text-center py-8"><span className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-solid rounded-full border-r-transparent"></span> Loading live events...</div>;
  }

  if (error) {
    return <p className="text-red-500 text-center py-8">Error: {error}</p>;
  }

  return (
    <Fragment>
      <Box sx={{ p: 3, backgroundColor: 'white', borderRadius: '8px', boxShadow: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold', color: '#333' }}>
            Your Live Events
          </Typography>
        </Box>
        {liveEvents.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No live events right now.
          </Typography>
        ) : (
          <Grid container spacing={4}>
            {liveEvents.map(event => (
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
                      height="280"
                      image={event.thumbnail}
                      alt={event.title}
                      sx={{ objectFit: 'contain', backgroundColor: '#f0f0f0' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        height: 280,
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
                    {event.meetingLink && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, color: '#555' }}>
                        <VideocamIcon sx={{ mr: 1, fontSize: '1rem' }} />
                        <Typography variant="body2" component="a" href={event.meetingLink} target="_blank" rel="noopener noreferrer" sx={{ color: 'blue.600', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { textDecoration: 'underline' } }}>
                          Join Link
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', fontSize: '0.85rem' }}>
                      {event.description || 'No description provided.'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      {/* If event is live, show red bouncy Live/Join button, else show edit/delete */}
                      <Button
                        variant="contained"
                        color="error"
                        sx={{
                          animation: 'pulse 1s infinite',
                          '@keyframes pulse': {
                            '0%': { boxShadow: '0 0 0 0 rgba(239,68,68, 0.7)' },
                            '70%': { boxShadow: '0 0 0 10px rgba(239,68,68, 0)' },
                            '100%': { boxShadow: '0 0 0 0 rgba(239,68,68, 0)' },
                          },
                          fontWeight: 'bold',
                        }}
                        href={event.meetingLink || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LIVE
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<ReportProblemIcon />}
                        disabled={cancelLoading}
                        onClick={e => {
                          e.stopPropagation();
                          handleClickCancel(event._id, event.title);
                        }}
                      >
                        Cancel
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
      <EditEventModal
        open={editModalOpen}
        onClose={handleEditModalClose}
        event={eventToEdit}
        onUpdate={handleEventUpdate}
      />
      <Dialog
        open={openCancelDialog}
        onClose={handleCloseCancelDialog}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">{"Confirm Cancellation"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            {eventToCancel && `Are you sure you want to cancel the event: "${eventToCancel.title}"? This will notify all participants and cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} color="primary">
            No
          </Button>
          <Button onClick={confirmCancel} color="error" autoFocus disabled={cancelLoading}>
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
}

export default LiveEvents; 