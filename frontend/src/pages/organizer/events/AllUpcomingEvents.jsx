import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { Clock, Calendar, Video, Edit, Trash2, Loader2 } from 'lucide-react';
import EventDetailModal from '../../../components/events/EventDetailModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import dayjs from 'dayjs';

function AllUpcomingEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);

  // New state for delete confirmation dialog
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null); // { _id: '', title: '' }

  useEffect(() => {
    const fetchAllUpcomingEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setError("Authentication token not found.");
          setIsLoading(false);
          return;
        }

        // Fetch all upcoming events (consider pagination for large number of events)
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/organizer/upcoming?limit=1000`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Filter events as upcoming using local time
        const now = dayjs();
        const upcomingEvents = (response.data.events || []).filter(event => {
          const eventStart = dayjs(event.date + 'T' + event.startTime);
          return now.isBefore(eventStart);
        });
        setEvents(upcomingEvents);
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to fetch all upcoming events.';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === 'organizer') {
      fetchAllUpcomingEvents();
    }
  }, [user]);

  const handleCardClick = (eventId) => {
    setSelectedEventId(eventId);
  };

  const handleCloseModal = () => {
    setSelectedEventId(null);
  };

  // Function to open the confirmation dialog
  const handleClickDelete = (eventId, eventTitle) => {
    setEventToDelete({ _id: eventId, title: eventTitle });
    setOpenConfirmDialog(true);
  };

  // Function to close the confirmation dialog
  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
    setEventToDelete(null);
  };

  // Actual deletion logic, called after confirmation
  const confirmDelete = async () => {
    if (!eventToDelete) return;
    handleCloseConfirmDialog(); // Close dialog immediately

    try {
      setIsLoading(true); // Show loading while deleting
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/${eventToDelete._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(`Event "${eventToDelete.title}" deleted successfully!`);
      // Filter out the deleted event from the state
      setEvents(prevEvents => prevEvents.filter(event => event._id !== eventToDelete._id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete event.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setEventToDelete(null); // Clear the event to delete
    }
  };

  if (!user || user.role !== 'organizer') {
    return (
      <div className="text-center text-red-500 py-8">
        Access Denied: You must be an organizer to view all upcoming events.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span className="text-lg">Loading all upcoming events...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-8">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
        All Upcoming Events
      </h3>
      
      {events.length === 0 ? (
        <div className="text-center text-zinc-600 dark:text-zinc-400 py-8">
          No upcoming events found. Create an event to see it here!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map(event => (
            <Card
              key={event._id}
              className="h-full flex flex-col shadow-lg rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-[1.02] hover:shadow-xl border border-zinc-200 dark:border-zinc-700"
              onClick={() => handleCardClick(event._id)}
            >
              {event.thumbnail ? (
                <div className="h-48 overflow-hidden">
                  <img
                    src={event.thumbnail}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-lg font-semibold text-center px-4">
                  No Image Available
                </div>
              )}
              
              <CardContent className="flex-grow p-4">
                <h4 className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mb-3 line-clamp-2">
                  {event.title}
                </h4>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center text-zinc-600 dark:text-zinc-300 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{dayjs(event.date).format('ddd, MMM D, YYYY')}</span>
                  </div>
                  
                  <div className="flex items-center text-zinc-600 dark:text-zinc-300 text-sm">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{event.startTime} - {event.endTime}</span>
                  </div>
                  
                  {event.meetingLink && (
                    <div className="flex items-center text-zinc-600 dark:text-zinc-300 text-sm">
                      <Video className="w-4 h-4 mr-2" />
                      <a
                        href={event.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Join Link
                      </a>
                    </div>
                  )}
                </div>
                
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-4 line-clamp-3">
                  {event.description || 'No description provided.'}
                </p>
                
                <div className="flex justify-end gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-indigo-700 dark:text-indigo-400 border-indigo-700 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 dark:text-red-400 border-red-600 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click from opening modal
                      handleClickDelete(event._id, event.title);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          open={Boolean(selectedEventId)}
          onClose={handleCloseModal}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openConfirmDialog} onOpenChange={setOpenConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              {eventToDelete && `Are you sure you want to delete the event: "${eventToDelete.title}"? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseConfirmDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AllUpcomingEvents; 