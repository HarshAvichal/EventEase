import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { convertLocalToUTC } from '../utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, Clock, Link, FileImage, Plus } from 'lucide-react';

dayjs.extend(utc);
dayjs.extend(timezone);

function CreateEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [eventData, setEventData] = useState({
    title: '',
    date: '',
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
    if (!eventData.date) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    
    // Manually append all fields for reliability
    const { date: localDate, startTime, endTime, title, description, meetingLink, thumbnail } = eventData;

    if (localDate && startTime && endTime) {
      const { date: utcDate, time: utcStartTime } = convertLocalToUTC(localDate, startTime);
      const { time: utcEndTime } = convertLocalToUTC(localDate, endTime);
      
      formData.append('date', utcDate);
      formData.append('startTime', utcStartTime);
      formData.append('endTime', utcEndTime);
    }
    
    formData.append('title', title);
    formData.append('description', description);
    formData.append('meetingLink', meetingLink);

    if (thumbnail) {
      formData.append('thumbnail', thumbnail);
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
    return (
      <div className="text-center text-red-500 py-8">
        Access Denied
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="shadow-lg border border-zinc-200 dark:border-zinc-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Create a New Event
          </CardTitle>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Fill out the details below to create your event.
          </p>
        </CardHeader>
        
        <CardContent>
          <form 
            onSubmit={handleSubmit} 
            className="space-y-6"
          >
            {/* Event Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Event Title
              </Label>
              <Input
                id="title"
                name="title"
                type="text"
                value={eventData.title}
                onChange={handleChange}
                placeholder="Enter event title"
                className={errors.title ? "border-red-500" : ""}
                required
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Event Date
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={eventData.date}
                onChange={handleChange}
                className={errors.date ? "border-red-500" : ""}
                required
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date}</p>
              )}
            </div>

            {/* Time Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={eventData.startTime}
                  onChange={handleChange}
                  className={errors.startTime ? "border-red-500" : ""}
                  required
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500">{errors.startTime}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  End Time
                </Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={eventData.endTime}
                  onChange={handleChange}
                  className={errors.endTime ? "border-red-500" : ""}
                  required
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Meeting Link */}
            <div className="space-y-2">
              <Label htmlFor="meetingLink" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                <Link className="w-4 h-4 mr-2" />
                Meeting Link (Jitsi)
              </Label>
              <Input
                id="meetingLink"
                name="meetingLink"
                type="url"
                value={eventData.meetingLink}
                onChange={handleChange}
                placeholder="https://meet.google.com/..."
                className={errors.meetingLink ? "border-red-500" : ""}
              />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                If not provided, a Jitsi meeting link will be auto-generated.
              </p>
              {errors.meetingLink && (
                <p className="text-sm text-red-500">{errors.meetingLink}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Event Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={eventData.description}
                onChange={handleChange}
                placeholder="Describe your event..."
                rows={4}
                className={errors.description ? "border-red-500" : ""}
                required
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
            </div>

            {/* Thumbnail */}
            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                <FileImage className="w-4 h-4 mr-2" />
                Thumbnail (Optional)
              </Label>
              <div className="flex items-center space-x-4">
                <label
                  htmlFor="thumbnail"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Choose File
                </label>
                <input
                  id="thumbnail"
                  name="thumbnail"
                  type="file"
                  onChange={handleChange}
                  accept="image/*"
                  className="hidden"
                />
                {eventData.thumbnail && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {eventData.thumbnail.name}
                  </span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Event...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Create Event
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateEvent; 