import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, Link, Users, Loader2, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { convertUTCToLocal } from '../utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, authAxios } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRSVPd, setIsRSVPd] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);

  const fetchEventDetails = async (isInitialFetch = false) => {
    if (isInitialFetch) {
      setLoading(true);
    }
    try {
      const response = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/details/${eventId}`);
      const eventData = response.data.event;

      if (user && user.role === 'participant' && eventData.status === 'canceled') {
        toast.error('This event has been canceled by the organizer.');
        navigate('/', { replace: true });
        return { shouldStopPolling: true };
      }

      setEvent(eventData);

      if (user) {
        const hasRSVPd = (eventData.rsvpList || []).some(rsvp => rsvp.participantId === user.id);
        setIsRSVPd(hasRSVPd);
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      if (isInitialFetch) {
        setError('Failed to load event details');
        toast.error('Failed to load event details');
      }
      return { shouldStopPolling: true };
    } finally {
      if (isInitialFetch) {
        setLoading(false);
      }
    }
    return { shouldStopPolling: false };
  };

  useEffect(() => {
    if (!authLoading) {
      fetchEventDetails(true); 

      const intervalId = setInterval(async () => {
        const { shouldStopPolling } = await fetchEventDetails(false);
        if (shouldStopPolling) {
          clearInterval(intervalId);
        }
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [eventId, authLoading, user]);


  const handleRSVP = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to RSVP for events');
      navigate('/login');
      return;
    }

    setRsvpLoading(true);
    try {
      await authAxios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rsvp/${eventId}`);
      toast.success('Successfully RSVPd for the event!');
      await fetchEventDetails(); 
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to RSVP for the event';
      toast.error(errorMessage);
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCancelRSVP = async () => {
    setRsvpLoading(true);
    try {
      await authAxios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rsvp/${eventId}/cancel`);
      toast.success('RSVP cancelled successfully');
      setShowAttendees(false);
      await fetchEventDetails(); 
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel RSVP';
      toast.error(errorMessage);
    } finally {
      setRsvpLoading(false);
    }
  };
  
  const handleToggleAttendees = async () => {
    if (showAttendees) {
      setShowAttendees(false);
      return;
    }
    try {
      const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/rsvp/${eventId}/attendees`);
      setAttendees(res.data.attendees);
      setShowAttendees(true);
    } catch (err) {
      toast.error('Could not fetch attendees.');
      setAttendees([]);
    }
  };

  const handleAccessLinkClick = (e) => {
    if (!isRSVPd) {
      e.preventDefault();
      toast.error('You must RSVP to access the meeting link');
      return;
    }
    if (event.meetingLink && event.meetingLink.startsWith('http')) {
      window.open(event.meetingLink, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('Meeting link is not available.');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Event not found.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLive = event.status === 'live';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="shadow-lg border-border overflow-hidden">
        <div className="w-full h-64 md:h-80 bg-muted">
          <img
            src={event.thumbnail || '/placeholder.png'}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>

        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-primary leading-tight">
              {event.title}
            </h1>
            {isLive && (
              <Badge variant="destructive" className="text-base font-semibold px-4 py-1 animate-pulse">
                LIVE
              </Badge>
            )}
          </div>
          
          <div className="mb-6 border-b pb-6">
            <p className="text-lg text-muted-foreground leading-relaxed">
              {event.description || 'No description available.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-base">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-3 text-primary" />
              <span>{convertUTCToLocal(event.date, event.startTime).displayDate}</span>
            </div>
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-3 text-primary" />
              <span>{convertUTCToLocal(event.date, event.startTime).displayTime} - {convertUTCToLocal(event.date, event.endTime).displayTime}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3 text-primary" />
              <span>{event.registrationCount || 0} people are attending</span>
            </div>
            <div className="flex items-center">
               <DollarSign className="w-5 h-5 mr-3 text-primary" />
              <span className="font-bold">{event.price ? `$${event.price}` : 'FREE'}</span>
            </div>
            <div className="flex items-center">
              <Link className="w-5 h-5 mr-3 text-primary" />
              <a 
                href={isRSVPd ? event.meetingLink : undefined} 
                className={`underline ${isRSVPd ? 'text-blue-600 dark:text-blue-400 hover:text-blue-800' : 'text-muted-foreground cursor-pointer'}`}
                onClick={handleAccessLinkClick}
                target="_blank"
                rel="noopener noreferrer"
              >
                {isRSVPd ? 'Access Meeting Link' : 'RSVP to access meeting link'}
              </a>
            </div>
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-3 text-primary" />
              <span>
                Organized by: {event.organizerId?.firstName
                  ? `${event.organizerId.firstName} ${event.organizerId.lastName}`
                  : event.organizerName || event.organizer || 'Unknown'}
              </span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated && (
              <>
                {!isRSVPd ? (
                  <Button onClick={handleRSVP} disabled={rsvpLoading || isLive} size="lg">
                    {rsvpLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Registering...</> : 'RSVP for Event'}
                  </Button>
                ) : (
                  <Button variant="destructive" onClick={handleCancelRSVP} disabled={rsvpLoading || isLive} size="lg">
                    {rsvpLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Cancelling...</> : 'Cancel RSVP'}
                  </Button>
                )}
                <Button variant="secondary" onClick={handleToggleAttendees} size="lg">
                  {showAttendees ? 'Hide Attendees' : 'View Attendees'}
                </Button>
              </>
            )}
          </div>

          {showAttendees && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-2xl font-bold mb-4 text-center">Registered Attendees</h3>
              {attendees.length > 0 ? (
                <ul className="space-y-3 max-w-md mx-auto">
                  {attendees.map((attendee, index) => (
                    <li key={index} className="bg-muted p-4 rounded-lg flex items-center justify-between">
                      <span className="font-medium">{attendee.name}</span>
                      <span className="text-muted-foreground">{attendee.email}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground">No one has registered yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default EventDetails; 