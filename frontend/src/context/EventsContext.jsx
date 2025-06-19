import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const EventsContext = createContext();

export function useEvents() {
  return useContext(EventsContext);
}

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication token not found.');
        setIsLoading(false);
        return;
      }
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/organizer/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEvents(response.data.events || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch events.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllEvents();
    const intervalId = setInterval(fetchAllEvents, 20000); // 20 seconds
    return () => clearInterval(intervalId);
  }, [fetchAllEvents]);

  return (
    <EventsContext.Provider value={{ events, isLoading, error, refetchEvents: fetchAllEvents }}>
      {children}
    </EventsContext.Provider>
  );
} 