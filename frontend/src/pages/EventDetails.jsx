import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaRegCalendarAlt, FaRegClock, FaLink } from 'react-icons/fa';
import dayjs from 'dayjs';

const EventDetails = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { authAxios, isAuthenticated, loading: authLoading } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendees, setAttendees] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [isRSVPd, setIsRSVPd] = useState(false);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/details/${eventId}`);
        setEvent(res.data.event);
        // Robust RSVP detection: check if current user is in rsvpList
        const rsvpList = res.data.event.rsvpList || [];
        const currentUserId = res.data.event.currentUserId;
        const isRSVPdNow = rsvpList.some(rsvp => rsvp.participantId === currentUserId);
        setIsRSVPd(isRSVPdNow);
        // Redirect if event is completed and user is not RSVP'd
        const now = new Date();
        const eventEnd = new Date(`${res.data.event.date}T${res.data.event.endTime}`);
        if (!isRSVPdNow && now > eventEnd) {
          toast.error('This event has ended.');
          navigate('/dashboard/participant/upcoming', { replace: true });
        }
      } catch (err) {
        setEvent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId, authAxios, isAuthenticated, authLoading, navigate]);

  const fetchAttendees = async () => {
    try {
      const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rsvp/${eventId}/attendees`);
      setAttendees(res.data.attendees);
      setShowAttendees(true);
    } catch (err) {
      setAttendees([]);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await authAxios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rsvp/${eventId}`);
      setIsRSVPd(true);
      toast.success('You have registered for the event!');
      // Refetch event to update RSVP list and access link
      const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/details/${eventId}`);
      setEvent(res.data.event);
      // Show attendees after registering
      await fetchAttendees();
    } catch (err) {
      if (err.response && err.response.status === 400) {
        toast.error('You are already registered for this event.');
      } else {
        toast.error('Failed to register.');
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRSVP = async () => {
    setRegistering(true);
    try {
      await authAxios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rsvp/${eventId}/cancel`);
      setIsRSVPd(false);
      toast.success('You have unregistered from the event.');
      // Refetch event to update RSVP list and access link
      const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/details/${eventId}`);
      setEvent(res.data.event);
      // Show attendees after unregistering
      await fetchAttendees();
    } catch (err) {
      toast.error('Failed to unregister.');
    } finally {
      setRegistering(false);
    }
  };

  const handleAccessLinkClick = (e) => {
    e.preventDefault();
    if (!isRSVPd) {
      toast('You need to register to access the link.', { icon: '🔒' });
    } else if (event.meetingLink && event.meetingLink.startsWith('http')) {
      window.open(event.meetingLink, '_blank');
    } else {
      toast('Meeting link is not available.', { icon: '❓' });
    }
  };

  const handleToggleAttendees = async () => {
    if (showAttendees) {
      setShowAttendees(false);
    } else {
      try {
        const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rsvp/${eventId}/attendees`);
        setAttendees(res.data.attendees);
        setShowAttendees(true);
      } catch (err) {
        setAttendees([]);
      }
    }
  };

  if (authLoading || loading) return <div className="text-center py-8">Loading event details...</div>;
  if (!event) return <div className="text-center py-8 text-red-500">Event not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6 mt-8">
        <img src={event.thumbnail} alt={event.title} className="w-full h-64 object-cover rounded mb-4" />
        <h2 className="text-3xl font-bold mb-2">{event.title}</h2>
        <div className="text-gray-600 mb-2 flex flex-wrap items-center">
          <span className="mr-4 flex items-center"><FaRegCalendarAlt className="mr-1" /> {dayjs(event.date + 'T' + event.startTime).format('ddd, MMM D, YYYY')}</span>
          <span className="mr-4 flex items-center"><FaRegClock className="mr-1" /> {dayjs(event.date + 'T' + event.startTime).format('HH:mm')} - {dayjs(event.date + 'T' + event.endTime).format('HH:mm')}</span>
          <span className="mr-4 flex items-center">
            <FaLink className="mr-1" /> <a href="#" className={`underline ${isRSVPd ? 'text-blue-700' : 'text-gray-500 cursor-pointer'}`} onClick={handleAccessLinkClick}>
              Access Link
            </a>
          </span>
        </div>
        <div className="mb-2">
          <span className="text-green-700 font-semibold mr-4">{event.price ? `₹${event.price}` : 'FREE'}</span>
          <span className="text-gray-500">Organizer: {event.organizerId?.firstName} {event.organizerId?.lastName}</span>
        </div>
        <div className="mb-4">
          {event.tags && event.tags.map((tag, idx) => (
            <span key={idx} className="bg-gray-200 text-gray-700 px-2 py-1 rounded mr-2 mb-1 text-xs font-medium">{tag}</span>
          ))}
        </div>
        <div className="mb-4">
          <span className="font-semibold">{event.registrationCount} going</span>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {!isRSVPd ? (
            <button
              className="px-4 py-2 rounded font-semibold transition-colors duration-200 bg-green-600 text-white hover:bg-green-700"
              onClick={handleRegister}
              disabled={registering}
            >
              {registering ? 'Registering...' : 'Register'}
            </button>
          ) : (
            <button
              className="px-4 py-2 rounded font-semibold transition-colors duration-200 bg-red-500 text-white hover:bg-red-600"
              onClick={handleCancelRSVP}
              disabled={registering}
            >
              {registering ? 'Cancelling...' : 'Cancel RSVP'}
            </button>
          )}
          <button
            className="px-4 py-2 rounded font-semibold bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleToggleAttendees}
          >
            {showAttendees ? 'Hide Attendees' : 'View Attendees'}
          </button>
        </div>
        {showAttendees && (
          <div className="bg-gray-100 rounded p-4 mt-4">
            <h3 className="text-lg font-bold mb-2">Registered Attendees</h3>
            {attendees.length === 0 ? (
              <div>No attendees yet.</div>
            ) : (
              <ul>
                {attendees.map((a, idx) => (
                  <li key={idx} className="mb-1">{a.name} ({a.email})</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-2">Details</h3>
          <div className="text-gray-700 whitespace-pre-line">{event.description}</div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails; 