import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { Clock, Calendar, Video, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import EventDetailModal from '../../../components/events/EventDetailModal';
import FeedbackModal from '../../../components/events/FeedbackModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import dayjs from 'dayjs';
import { convertUTCToLocal } from '../../../utils/dateUtils';

function CompletedEvents() {
  const { user, authAxios } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [feedbackEvent, setFeedbackEvent] = useState(null);

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    const fetchCompletedEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError("Authentication token not found.");
          setIsLoading(false);
          return;
        }
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/organizer/completed`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const completedEvents = (response.data.events || []).filter(event => event.computedStatus === 'completed');
        setEvents(completedEvents);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch completed events.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    if (user && user.role === 'organizer') {
      fetchCompletedEvents();
    }
  }, [user]);

  const handleCardClick = (eventId) => setSelectedEventId(eventId);
  const handleCloseModal = () => setSelectedEventId(null);
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
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/${eventToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Event "${eventToDelete.title}" deleted successfully!`);
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventToDelete._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event.');
      toast.error(err.response?.data?.message || 'Failed to delete event.');
    } finally {
      setIsLoading(false);
      setEventToDelete(null);
    }
  };

  if (!user || user.role !== 'organizer') return <div className="text-center text-red-500 py-8">Access Denied</div>;
  if (isLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="w-6 h-6 animate-spin mr-2" /><span>Loading events...</span></div>;
  if (error) return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <>
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Your Completed Events</h3>
        {events.length === 0 ? (
          <div className="text-center text-zinc-600 dark:text-zinc-400 py-8">No completed events found.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {events.map(event => (
              <Card key={event._id} className="h-full flex flex-col shadow-lg rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-xl border border-zinc-200 dark:border-zinc-700" onClick={() => handleCardClick(event._id)}>
                <div className="h-56 overflow-hidden">
                  <img
                    src={event.thumbnail || '/no_image.png'}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/no_image.png';
                    }}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="flex-grow p-4">
                  <h4 className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mb-3 line-clamp-2 leading-tight">{event.title}</h4>
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center text-zinc-600 dark:text-zinc-300 text-sm"><Calendar className="w-4 h-4 mr-2" /><span>{dayjs(event.date).format('ddd, MMM D, YYYY')}</span></div>
                    <div className="flex items-center text-zinc-600 dark:text-zinc-300 text-sm"><Clock className="w-4 h-4 mr-2" /><span>{convertUTCToLocal(event.date, event.startTime).displayTime} - {convertUTCToLocal(event.date, event.endTime).displayTime}</span></div>
                    {event.computedStatus === 'completed' ? (
                      <div className="flex items-center text-red-600 dark:text-red-400 text-sm font-semibold"><Video className="w-4 h-4 mr-2" /><span>Event has ended</span></div>
                    ) : ( event.meetingLink && ( <div className="flex items-center text-zinc-600 dark:text-zinc-300 text-sm"><Video className="w-4 h-4 mr-2" /><a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>View Link</a></div>))}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-3">{event.description || 'No description provided.'}</p>
                  <div className="flex justify-end gap-2 mt-auto">
                    <Button variant="outline" size="sm" className="text-indigo-700 dark:text-indigo-400 border-indigo-700 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950" onClick={(e) => { e.stopPropagation(); setFeedbackEvent(event); }}><MessageSquare className="w-4 h-4 mr-1" />View Feedback</Button>
                    <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950" onClick={(e) => { e.stopPropagation(); handleClickDelete(event._id, event.title); }}><Trash2 className="w-4 h-4 mr-1" />Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {selectedEventId && <EventDetailModal eventId={selectedEventId} open={Boolean(selectedEventId)} onClose={handleCloseModal} />}
      <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Deletion</DialogTitle><DialogDescription>{eventToDelete && `Are you sure you want to delete the event: "${eventToDelete.title}"? This action cannot be undone.`}</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={handleCloseConfirmDialog}>Cancel</Button><Button variant="destructive" onClick={confirmDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {feedbackEvent && <FeedbackModal open={!!feedbackEvent} onClose={() => setFeedbackEvent(null)} event={feedbackEvent} authAxios={authAxios} />}
    </>
  );
}

export default CompletedEvents; 