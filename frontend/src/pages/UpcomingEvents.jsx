import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventCard from '../components/events/EventCard';
import { useAuth } from '../context/AuthContext';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { authAxios } = useAuth();

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const response = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/participant/upcoming`);
        setEvents(response.data.events);
      } catch (err) {
        setError('Failed to fetch upcoming events.');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();
  }, [authAxios]);

  if (loading) {
    return <div className="text-center py-10">Loading events...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Upcoming Events</h1>
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event._id} onClick={() => navigate(`/events/${event._id}`)} className="cursor-pointer">
              <EventCard event={event} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">No upcoming events found.</div>
      )}
    </div>
  );
};

export default UpcomingEvents; 