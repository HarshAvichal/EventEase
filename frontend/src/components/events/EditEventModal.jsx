import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

const EditEventModal = ({ open, onClose, event, onUpdate }) => {
  const { authAxios } = useAuth();
  const [form, setForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    description: '',
    thumbnail: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        date: event.date ? event.date.slice(0, 10) : '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        meetingLink: event.meetingLink || '',
        description: event.description || '',
        thumbnail: event.thumbnail || '',
      });
      setThumbnailFile(null);
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let thumbnailUrl = form.thumbnail;
      if (thumbnailFile) {
        const data = new FormData();
        data.append('file', thumbnailFile);
        data.append('upload_preset', 'eventease_present');
        const uploadRes = await axios.post('https://api.cloudinary.com/v1_1/da6kpwqmh/image/upload', data);
        thumbnailUrl = uploadRes.data.secure_url;
        // Transform the URL for consistent card sizing
        if (thumbnailUrl.includes('/upload/')) {
          thumbnailUrl = thumbnailUrl.replace('/upload/', '/upload/w_300,h_200,c_fill/');
        }
      }
      // Send local date/time as entered by the user (no UTC conversion)
      let localDate = form.date;
      let localStartTime = form.startTime;
      let localEndTime = form.endTime;
      if (form.date && form.startTime && form.endTime) {
        localDate = dayjs(form.date).format('YYYY-MM-DD');
        localStartTime = form.startTime;
        localEndTime = form.endTime;
      }
      const updatedEvent = {
        ...form,
        date: localDate,
        startTime: localStartTime,
        endTime: localEndTime,
        thumbnail: thumbnailUrl,
      };
      // Test GET request to check interceptor
      try {
        await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/me`);
      } catch (err) {
        console.log('Debug - Test GET /me error:', err);
      }
      // Debug log for token and event
      console.log('Debug - About to PATCH event. Token:', localStorage.getItem('accessToken'));
      console.log('Debug - Event to update:', updatedEvent);
      await authAxios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/events/${event._id}`,
        updatedEvent
      );
      toast.success('Event updated successfully!');
      onUpdate({ ...event, ...updatedEvent });
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Event</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="normal"
            label="Date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
            required
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              margin="normal"
              label="Start Time"
              name="startTime"
              type="time"
              value={form.startTime}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ flex: 1 }}
            />
            <TextField
              margin="normal"
              label="End Time"
              name="endTime"
              type="time"
              value={form.endTime}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            margin="normal"
            label="Meeting Link"
            name="meetingLink"
            value={form.meetingLink}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="normal"
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={2}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Thumbnail (optional)
            </Typography>
            <input type="file" accept="image/*" onChange={handleThumbnailChange} />
            {form.thumbnail && !thumbnailFile && (
              <Box sx={{ mt: 1 }}>
                <img src={form.thumbnail} alt="Current Thumbnail" style={{ maxWidth: 120, borderRadius: 8 }} />
              </Box>
            )}
            {thumbnailFile && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption">New image selected: {thumbnailFile.name}</Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Update Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditEventModal; 