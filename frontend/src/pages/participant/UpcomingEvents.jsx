import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import EventCard from '../../components/events/EventCard';
import dayjs from 'dayjs';

function UpcomingEvents() {
  const { authAxios, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rsvpdEventIds, setRsvpdEventIds] = useState([]);
  const [rsvpdLiveEventIds, setRsvpdLiveEventIds] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = (e) => {
      navigate('/dashboard/participant/upcoming', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  // Fetch upcoming events
  useEffect(() => {
    let intervalId;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/participant/upcoming`);
        setEvents(res.data.events || []);
        // Debug: Log fetched events
        console.log('Fetched events from backend:', res.data.events);
      } catch (err) {
        setEvents([]);
        console.error('Error fetching upcoming events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
    intervalId = setInterval(fetchEvents, 20000); // 20 seconds
    return () => clearInterval(intervalId);
  }, [authAxios]);

  // Fetch RSVP'd events for this participant and get live event IDs
  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/participant/my-events`);
        // Find RSVP'd live events
        const liveIds = (res.data.myEvents?.live || []).map(ev => ev._id || ev.id);
        setRsvpdLiveEventIds(liveIds);
        setRsvpdEventIds([
          ...(res.data.myEvents?.upcoming || []).map(ev => ev._id || ev.id),
          ...liveIds
        ]);
      } catch (err) {
        setRsvpdEventIds([]);
        setRsvpdLiveEventIds([]);
      }
    };
    fetchMyEvents();
  }, [authAxios]);

  // Fetch participant counts for all events
  useEffect(() => {
    const fetchCounts = async () => {
      const counts = {};
      await Promise.all(events.map(async (event) => {
        try {
          const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rsvp/${event._id}/count`);
          counts[event._id] = res.data.count;
        } catch {
          counts[event._id] = 0;
        }
      }));
      setParticipantCounts(counts);
    };
    if (events.length > 0) fetchCounts();
  }, [events, authAxios]);

  // RSVP handler
  const handleRegister = async (eventId) => {
    try {
      await authAxios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rsvp/${eventId}`);
      setRsvpdEventIds(prev => [...prev, eventId]);
      setParticipantCounts(prev => ({ ...prev, [eventId]: (prev[eventId] || 0) + 1 }));
    } catch (err) {
      console.error('RSVP POST - Error for eventId:', eventId, err);
      // Optionally show error
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading upcoming events...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Upcoming Events</h2>
      {events.length === 0 ? (
        <div className="text-gray-500 text-center">No upcoming events found.</div>
      ) : (
        events
          .slice()
          .sort((a, b) => {
            const aDate = dayjs(a.date + 'T' + a.startTime);
            const bDate = dayjs(b.date + 'T' + b.startTime);
            return aDate.valueOf() - bDate.valueOf(); // earliest first
          })
          // Remove events that are currently live
          .filter(event => {
            const now = dayjs();
            const eventStart = dayjs(event.date + 'T' + event.startTime);
            const eventEnd = dayjs(event.date + 'T' + event.endTime);
            // Debug: Log filter decision
            console.log(`Filtering event: ${event.title}, now: ${now.toISOString()}, start: ${eventStart.toISOString()}, end: ${eventEnd.toISOString()}, show:`, now.isBefore(eventStart) || now.isAfter(eventEnd));
            return now.isBefore(eventStart) || now.isAfter(eventEnd);
          })
          .filter(event => !rsvpdLiveEventIds.includes(event._id))
          .map(event => (
            <EventCard
              key={event._id}
              event={event}
              participantCount={participantCounts[event._id]}
              onRegister={() => handleRegister(event._id)}
              isRSVPd={rsvpdEventIds.includes(event._id)}
            />
          ))
      )}
    </div>
  );
}

export default UpcomingEvents; 