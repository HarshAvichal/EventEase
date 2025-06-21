import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import FeedbackModal from '../../components/events/FeedbackModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Clock, Loader2, Trash2 } from 'lucide-react';
import { convertUTCToLocal, isEventInPast } from '../../utils/dateUtils';
import dayjs from 'dayjs';

function CompletedEvents() {
  const { authAxios, user } = useAuth();
  const [completedEvents, setCompletedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackEvent, setFeedbackEvent] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventToRemove, setEventToRemove] = useState(null);

  useEffect(() => {
    const fetchCompletedEvents = async () => {
      setLoading(true);
      try {
        const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/participant/completed`);
        setCompletedEvents(res.data.events || []);
      } catch (err) {
        console.error("Failed to fetch completed events:", err);
        setCompletedEvents([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchCompletedEvents();
    }
  }, [authAxios, user]);

  const handleRemoveClick = (event) => {
    setEventToRemove(event);
    setOpenConfirmDialog(true);
  };

  const confirmRemove = () => {
    if (!eventToRemove) return;
    setCompletedEvents((prev) => prev.filter((e) => e._id !== eventToRemove._id));
    setOpenConfirmDialog(false);
    setEventToRemove(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-lg">Loading your completed events...</span>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-3xl font-bold mb-8 text-zinc-800 dark:text-zinc-100">Completed Events</h2>
        
        {completedEvents.length === 0 ? (
          <div className="text-center text-zinc-500 dark:text-zinc-400 py-8">
            No completed events found.
          </div>
        ) : (
          <div className="space-y-6">
            {completedEvents
              .slice()
              .sort((a, b) => dayjs(b.date + 'T' + b.endTime).valueOf() - dayjs(a.date + 'T' + a.endTime).valueOf())
              .map((event) => (
                <Card
                  key={event._id}
                  className="flex flex-col md:flex-row overflow-hidden shadow-md transition-shadow hover:shadow-lg border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="relative w-full md:w-48 h-48 md:h-auto flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
                    <img
                      src={event.thumbnail || '/placeholder.png'}
                      onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4 flex-grow flex flex-col justify-between w-full">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-400 line-clamp-2">
                          {event.title}
                        </h3>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-zinc-400 hover:text-red-600 dark:hover:text-red-500 -mt-2 -mr-2"
                          title="Remove this event"
                          onClick={() => handleRemoveClick(event)}
                        >
                          <Trash2 size={20} />
                        </Button>
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-3">
                        Organizer: {event.organizerId?.firstName
                          ? `${event.organizerId.firstName} ${event.organizerId.lastName}`
                          : 'Unknown'}
                      </div>
                      <div className="flex flex-wrap items-center text-zinc-600 dark:text-zinc-300 text-sm gap-x-4 gap-y-1">
                        <span className="flex items-center">
                          <Calendar className="mr-2 w-4 h-4" />
                          {convertUTCToLocal(event.date, event.startTime).displayDate}
                        </span>
                        <span className="flex items-center">
                          <Clock className="mr-2 w-4 h-4" />
                          {convertUTCToLocal(event.date, event.startTime).displayTime} - {convertUTCToLocal(event.date, event.endTime).displayTime}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                        onClick={() => setFeedbackEvent(event)}
                      >
                        Give Feedback
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </div>

      <FeedbackModal
        open={!!feedbackEvent}
        onClose={() => setFeedbackEvent(null)}
        event={feedbackEvent}
        participantId={user?.id}
        authAxios={authAxios}
      />

      <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove the event "{eventToRemove?.title}" from this list?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenConfirmDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CompletedEvents; 