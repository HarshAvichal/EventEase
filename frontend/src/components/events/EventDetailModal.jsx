import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Calendar, Clock, Video, Users, DollarSign, WifiOff, Link as LinkIcon } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { convertUTCToLocal } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';

const EventDetailModal = ({ open, onClose, eventId }) => {
  const { authAxios } = useAuth();
  const [eventDetails, setEventDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      setIsLoading(true);
      try {
        const response = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/details/${eventId}`);
        setEventDetails(response.data.event);
      } catch (error) {
        toast.error('Failed to load event details');
        console.error("Fetch event details error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchEventDetails();
    }
  }, [open, eventId, authAxios]);
  
  const handleClose = () => {
    setEventDetails(null);
    onClose();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      );
    }

    if (!eventDetails) {
      return (
        <div className="flex flex-col justify-center items-center min-h-[400px] text-center p-6">
          <WifiOff className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold">Failed to load event details</h3>
          <p className="text-muted-foreground">Please check your connection and try again.</p>
        </div>
      );
    }
    
    const { displayDate, displayTime: startTime } = convertUTCToLocal(eventDetails.date, eventDetails.startTime);
    const { displayTime: endTime } = convertUTCToLocal(eventDetails.date, eventDetails.endTime);

    return (
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-primary">{eventDetails.title}</h2>
          {eventDetails.computedStatus === 'live' && (
            <Badge variant="destructive" className="text-base animate-pulse">LIVE</Badge>
          )}
        </div>
        
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {eventDetails.description || 'No description provided.'}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-base">
          <div className="flex items-center gap-3"><Calendar className="w-5 h-5 text-primary" /><span>{displayDate}</span></div>
          <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-primary" /><span>{startTime} - {endTime}</span></div>
          <div className="flex items-center gap-3"><Users className="w-5 h-5 text-primary" /><span>{eventDetails.registrationCount || 0} participants</span></div>
          <div className="flex items-center gap-3"><DollarSign className="w-5 h-5 text-primary" /><span>{eventDetails.price ? `$${eventDetails.price}` : 'FREE'}</span></div>
        </div>

        {eventDetails.computedStatus === 'live' && eventDetails.meetingLink && (
          <div className="my-6">
            <Button asChild size="lg" className="w-full bg-red-600 hover:bg-red-700">
              <a href={eventDetails.meetingLink} target="_blank" rel="noopener noreferrer">
                <Video className="w-5 h-5 mr-2" />
                Join Live Meeting
              </a>
            </Button>
          </div>
        )}

        {eventDetails.rsvpList && eventDetails.rsvpList.length > 0 && (
          <div className="pt-6 border-t">
            <h3 className="text-xl font-bold mb-4">Participants</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {eventDetails.rsvpList.map((rsvp, index) => (
                <div key={index} className="bg-muted p-3 rounded-lg flex justify-between items-center text-sm">
                  <span className="font-medium">{rsvp.participantName}</span>
                  <span className="text-muted-foreground">{rsvp.email}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 flex flex-row items-center justify-between sticky top-0 bg-background z-10 border-b">
          <DialogTitle className="text-lg font-semibold">{eventDetails?.title || 'Event Details'}</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <X className="w-5 h-5" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        <div className="w-full h-72 bg-muted">
          <img
            src={eventDetails?.thumbnail || '/no_image.png'}
            alt={eventDetails?.title || 'Event thumbnail'}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/no_image.png';
            }}
            className="w-full h-full object-cover"
          />
        </div>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal; 