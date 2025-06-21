import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useEvents } from '../../../context/EventsContext';
import { Clock, Calendar, Video, AlertTriangle, Loader2 } from 'lucide-react';
import EventDetailModal from '../../../components/events/EventDetailModal';
import EditEventModal from '../../../components/events/EditEventModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import dayjs from 'dayjs';
import { convertUTCToLocal } from '../../../utils/dateUtils';

function LiveEvents() {
  const { user } = useAuth();
  const { events, isLoading, error, refetchEvents } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [eventToCancel, setEventToCancel] = useState(null);

  const liveEvents = events.filter(event => event.computedStatus === 'live');

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
      setDeleteLoading(true);
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/${eventToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Event "${eventToDelete.title}" deleted successfully!`);
      await refetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event.');
    } finally {
      setDeleteLoading(false);
      setEventToDelete(null);
    }
  };

  const handleEditClick = (event) => {
    setEventToEdit(event);
    setEditModalOpen(true);
  };
  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setEventToEdit(null);
  };
  const handleEventUpdate = async () => await refetchEvents();
  const handleClickCancel = (eventId, eventTitle) => {
    setEventToCancel({ _id: eventId, title: eventTitle });
    setOpenCancelDialog(true);
  };
  const handleCloseCancelDialog = () => {
    setOpenCancelDialog(false);
    setEventToCancel(null);
  };

  const confirmCancel = async () => {
    if (!eventToCancel) return;
    handleCloseCancelDialog();
    try {
      setCancelLoading(true);
      const token = localStorage.getItem('accessToken');
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/${eventToCancel._id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`Event "${eventToCancel.title}" canceled successfully!`);
      await refetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel event.');
    } finally {
      setCancelLoading(false);
      setEventToCancel(null);
    }
  };

  if (!user || user.role !== 'organizer') return <div className="text-center text-red-500 py-8">Access Denied.</div>;
  if (isLoading) return <div className="flex justify-center items-center h-48"><Loader2 className="w-6 h-6 animate-spin mr-2" /><span>Loading live events...</span></div>;
  if (error) return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <>
      <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Your Live Events</h3></div>
        {liveEvents.length === 0 ? (
          <div className="text-center text-zinc-600 dark:text-zinc-400 py-8">No live events right now.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {liveEvents.map(event => (
              <Card key={event._id} className="h-full flex flex-col shadow-lg rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-xl border border-zinc-200 dark:border-zinc-700" onClick={() => handleCardClick(event._id)}>
                <div className="h-72 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
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
                    {event.meetingLink && (<div className="flex items-center text-zinc-600 dark:text-zinc-300 text-sm"><Video className="w-4 h-4 mr-2" /><a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline" onClick={(e) => e.stopPropagation()}>Join Link</a></div>)}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-3">{event.description || 'No description provided.'}</p>
                  <div className="flex gap-3 mt-auto">
                    <Button className="bg-red-600 hover:bg-red-700 text-white font-bold animate-pulse shadow-lg" href={event.meetingLink || '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>LIVE</Button>
                    <Button variant="outline" className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950" disabled={cancelLoading} onClick={(e) => { e.stopPropagation(); handleClickCancel(event._id, event.title); }}><AlertTriangle className="w-4 h-4 mr-1" />{cancelLoading ? 'Canceling...' : 'Cancel'}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      {selectedEventId && <EventDetailModal eventId={selectedEventId} open={Boolean(selectedEventId)} onClose={handleCloseModal} />}
      {editModalOpen && <EditEventModal event={eventToEdit} open={editModalOpen} onClose={handleEditModalClose} onEventUpdate={handleEventUpdate} />}
      <Dialog open={openCancelDialog} onOpenChange={setOpenCancelDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Cancel</DialogTitle><DialogDescription>Are you sure you want to cancel "{eventToCancel?.title}"?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCancelDialog}>Back</Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={cancelLoading}>{cancelLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Confirm Cancel'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default LiveEvents; 