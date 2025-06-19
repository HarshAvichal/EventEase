import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

// Material UI Imports
import { TextField, Button, Box, Typography, Container, CircularProgress } from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState({
    title: '',
    date: null,
    description: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    thumbnail: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!eventData.title.trim()) {
      newErrors.title = 'Event title is required';
    }
    if (!eventData.date || !dayjs(eventData.date).isValid()) {
      newErrors.date = 'Valid event date is required';
    }
    if (!eventData.description.trim()) {
      newErrors.description = 'Event description is required';
    }
    if (!eventData.startTime.trim()) {
      newErrors.startTime = 'Start time is required';
    }
    if (!eventData.endTime.trim()) {
      newErrors.endTime = 'End time is required';
    }
    const timeRegex = /^(?:2[0-3]|[01]?[0-9]):[0-5][0-9]$/;
    if (eventData.startTime && !timeRegex.test(eventData.startTime)) {
      newErrors.startTime = 'Invalid start time format (HH:mm)';
    }
    if (eventData.endTime && !timeRegex.test(eventData.endTime)) {
      newErrors.endTime = 'Invalid end time format (HH:mm)';
    }
    if (!newErrors.startTime && !newErrors.endTime && eventData.startTime >= eventData.endTime) {
        newErrors.endTime = 'End time must be after start time.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'thumbnail') {
      setEventData({ ...eventData, [name]: files[0] });
    } else {
      setEventData({ ...eventData, [name]: value });
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (newDate) => {
    setEventData(prev => ({ ...prev, date: newDate }));
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    // Send local date/time as entered by the user (no UTC conversion)
    if (eventData.date && eventData.startTime && eventData.endTime) {
      const localDate = dayjs(eventData.date).format('YYYY-MM-DD');
      formData.append('date', localDate);
      formData.append('startTime', eventData.startTime);
      formData.append('endTime', eventData.endTime);
    }
    for (const key in eventData) {
      if (['date', 'startTime', 'endTime'].includes(key)) continue; // Already handled above
      if (eventData[key] !== null) {
        formData.append(key, eventData[key]);
      }
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/create`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success(response.data.message || 'Event created successfully!');
      navigate('/dashboard/organizer/upcoming');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create event. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'organizer') {
    toast.error("You are not authorized to create events.");
    return <p>Access Denied</p>;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 4,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3
      }}>
        <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
          Create a New Event
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Fill out the details below to create your event.
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="title"
            label="Event Title"
            name="title"
            autoComplete="off"
            value={eventData.title}
            onChange={handleChange}
            error={!!errors.title}
            helperText={errors.title}
            sx={{ mb: 2 }}
          />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Event Date"
              value={eventData.date}
              onChange={handleDateChange}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  required 
                  fullWidth 
                  margin="normal"
                  error={!!errors.date}
                  helperText={errors.date}
                  sx={{ mb: 2 }}
                />
              )}
            />
          </LocalizationProvider>
          <TextField
            margin="normal"
            required
            fullWidth
            id="startTime"
            label="Start Time (HH:mm)"
            name="startTime"
            type="time"
            value={eventData.startTime}
            onChange={handleChange}
            error={!!errors.startTime}
            helperText={errors.startTime}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="endTime"
            label="End Time (HH:mm)"
            name="endTime"
            type="time"
            value={eventData.endTime}
            onChange={handleChange}
            error={!!errors.endTime}
            helperText={errors.endTime}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="meetingLink"
            label="Meeting Link (Optional)"
            name="meetingLink"
            value={eventData.meetingLink}
            onChange={handleChange}
            error={!!errors.meetingLink}
            helperText={errors.meetingLink || "If not provided, a Jitsi meeting link will be auto-generated."}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="description"
            label="Description"
            name="description"
            multiline
            rows={4}
            value={eventData.description}
            onChange={handleChange}
            error={!!errors.description}
            helperText={errors.description}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            fullWidth
            id="thumbnail"
            label="Event Thumbnail (Optional)"
            name="thumbnail"
            type="file"
            onChange={handleChange}
            error={!!errors.thumbnail}
            helperText={errors.thumbnail || "Upload an image for your event (optional)"}
            InputLabelProps={{ shrink: true }}
            inputProps={{ accept: 'image/*' }}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Event'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default CreateEvent; 