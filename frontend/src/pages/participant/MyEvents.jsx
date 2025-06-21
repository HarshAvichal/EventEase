import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import EventCard from '../../components/events/EventCard';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { getEventStatus } from '../../utils/dateUtils';

function MyEvents() {
  const { authAxios } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Push hasLiveEvents state to parent for sidebar indicator
  useEffect(() => {
    navigate('.', { state: { hasLiveEvents: liveEvents.length > 0 }, replace: true });
  }, [liveEvents.length, navigate]);

  // Fetch RSVP'd events
  useEffect(() => {
    let intervalId;
    const fetchMyEvents = async () => {
      setLoading(true);
      try {
        const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/participant/my-events`);
        const allEvents = [
          ...(res.data.myEvents.upcoming || []),
          ...(res.data.myEvents.live || []),
          ...(res.data.myEvents.completed || [])
        ];
        
        const upcoming = [];
        const live = [];
        
        allEvents.forEach(event => {
          // If event is canceled, skip it entirely
          if (event.status === 'canceled') {
            return;
          }

          const status = getEventStatus(event.date, event.startTime, event.endTime, event.status);

          if (status === 'upcoming') {
            upcoming.push(event);
          } else if (status === 'live') {
            live.push(event);
          }
        });

        setUpcomingEvents(upcoming);
        setLiveEvents(live);
      } catch (err) {
        setUpcomingEvents([]);
        setLiveEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMyEvents();
    intervalId = setInterval(fetchMyEvents, 20000); // 20 seconds
    return () => clearInterval(intervalId);
  }, [authAxios]);

  // Fetch participant counts for all events
  useEffect(() => {
    const fetchCounts = async (events) => {
      const counts = {};
      await Promise.all(events.map(async (event) => {
        const eventId = event._id || event.id;
        try {
          const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rsvp/${eventId}/count`);
          counts[eventId] = res.data.count;
        } catch {
          counts[eventId] = 0;
        }
      }));
      setParticipantCounts(prev => ({ ...prev, ...counts }));
    };
    if (upcomingEvents.length > 0) fetchCounts(upcomingEvents);
    if (liveEvents.length > 0) fetchCounts(liveEvents);
  }, [upcomingEvents, liveEvents, authAxios]);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">My Events</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-2xl font-semibold mb-4 text-blue-700 flex items-center">
          Live Events
        </h3>
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading your events...</div>
        ) : liveEvents.length === 0 ? (
          <div className="text-center text-gray-400">No live events right now.</div>
        ) : (
          <div className="space-y-4">
            {liveEvents
              .slice()
              .sort((a, b) => {
                const aDate = dayjs(a.date + 'T' + a.endTime);
                const bDate = dayjs(b.date + 'T' + b.endTime);
                return bDate.valueOf() - aDate.valueOf();
              })
              .map(event => {
                console.log('Rendering live event:', event.title, 'isLive will be set to true');
                return (
              <EventCard
                key={event._id || event.id}
                event={{ ...event, _id: event._id || event.id, registrationCount: participantCounts[event._id || event.id] }}
                isRSVPd={true}
              />
                );
              })}
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-2xl font-semibold mb-4 text-green-700">Upcoming Events</h3>
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading your events...</div>
        ) : upcomingEvents.length === 0 ? (
          <div className="text-center text-gray-400">No upcoming events found.</div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents
              .slice()
              .sort((a, b) => {
                const aDate = dayjs(a.date + 'T' + a.startTime);
                const bDate = dayjs(b.date + 'T' + b.startTime);
                return aDate.valueOf() - bDate.valueOf(); // soonest first
              })
              .map(event => (
              <EventCard
                key={event._id || event.id}
                event={{ ...event, _id: event._id || event.id, registrationCount: participantCounts[event._id || event.id] }}
                isRSVPd={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyEvents; 