import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MdDelete } from 'react-icons/md';
import FeedbackModal from '../../components/events/FeedbackModal';
import dayjs from 'dayjs';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { FaRegCalendarAlt, FaRegClock } from 'react-icons/fa';

function CompletedEvents() {
  const { authAxios, user } = useAuth();
  const [completedEvents, setCompletedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // Feedback modal state (to be implemented)
  const [feedbackEvent, setFeedbackEvent] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);

  useEffect(() => {
    const fetchCompletedEvents = async () => {
      setLoading(true);
      try {
        const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/participant/my-events`);
        const allEvents = [
          ...(res.data.myEvents.upcoming || []),
          ...(res.data.myEvents.live || []),
          ...(res.data.myEvents.completed || [])
        ];
        const now = dayjs();
        const completed = allEvents.filter(event => {
          const eventEnd = dayjs(event.date + 'T' + event.endTime);
          // If event is canceled, do not show it at all
          if (event.status === 'canceled') return false;
          return now.isAfter(eventEnd);
        });
        setCompletedEvents(completed);
      } catch (err) {
        setCompletedEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCompletedEvents();
  }, [authAxios]);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Completed Events</h2>
      {loading ? (
        <div className="text-center text-gray-500 py-8">Loading your completed events...</div>
      ) : completedEvents.length === 0 ? (
        <div className="text-center text-gray-400">No completed events found.</div>
      ) : (
        <div className="space-y-4">
          {completedEvents
            .slice() // copy array to avoid mutating state
            .sort((a, b) => {
              const aDate = dayjs(a.date + 'T' + a.endTime);
              const bDate = dayjs(b.date + 'T' + b.endTime);
              return bDate.valueOf() - aDate.valueOf(); // latest first
            })
            .map(event => (
            <div key={event._id || event.id} className="flex flex-col bg-white rounded-lg shadow-md p-4 mb-4 relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-600 focus:outline-none"
                title="Remove this event"
                onClick={() => {
                  setEventToDelete(event);
                  setOpenConfirmDialog(true);
                }}
              >
                <MdDelete size={22} />
              </button>
              <div className="text-xs text-gray-500 font-medium mb-2 flex items-center">
                Organizer: {event.organizerId?.firstName
                  ? `${event.organizerId.firstName} ${event.organizerId.lastName}`
                  : event.organizerName || event.organizer || 'Unknown'}
              </div>
              <div className="flex items-center mb-2">
                <img
                  src={event.thumbnail}
                  alt={event.title}
                  className="w-40 h-28 object-cover rounded-md mr-6"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap">
                    <span className="text-xl font-bold text-blue-800 truncate">
                      {event.title}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 mt-1 text-sm flex-wrap">
                    <span className="mr-2 flex items-center"><FaRegCalendarAlt className="mr-1" /> {dayjs(event.date + 'T' + event.startTime).format('ddd, MMM D, YYYY')}</span>
                    <span className="mr-2 flex items-center"><FaRegClock className="mr-1" /> {dayjs(event.date + 'T' + event.startTime).format('HH:mm')} - {dayjs(event.date + 'T' + event.endTime).format('HH:mm')}</span>
                  </div>
                </div>
                <button
                  className="ml-6 px-5 py-2 rounded font-semibold transition-colors duration-200 bg-green-600 text-white shadow-lg hover:bg-green-700 focus:ring-2 focus:ring-green-400 focus:outline-none"
                  onClick={() => setFeedbackEvent(event)}
                >
                  Give Feedback
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {console.log('[CompletedEvents] user:', user, 'user._id:', user?._id)}
      <FeedbackModal
        open={!!feedbackEvent}
        onClose={() => setFeedbackEvent(null)}
        event={feedbackEvent}
        participantId={user?.id}
        authAxios={authAxios}
      />
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the event: "{eventToDelete?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              setCompletedEvents(prev => prev.filter(e => (e._id || e.id) !== (eventToDelete._id || eventToDelete.id)));
              setOpenConfirmDialog(false);
            }}
            color="error"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default CompletedEvents; 