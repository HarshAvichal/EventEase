import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { convertUTCToLocal } from '../../utils/dateUtils';
import dayjs from 'dayjs';

function EventCard({ event, onRegister, isRSVPd }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState(event.status);

  useEffect(() => {
    const checkStatus = () => {
      const now = dayjs.utc();
      const startTime = dayjs.utc(`${event.date}T${event.startTime}`);
      const endTime = dayjs.utc(`${event.date}T${event.endTime}`);
      
      let currentStatus = 'upcoming';
      if (event.status === 'canceled') {
        currentStatus = 'canceled';
      } else if (now.isAfter(endTime)) {
        currentStatus = 'completed';
      } else if (now.isAfter(startTime)) {
        currentStatus = 'live';
      }
      
      if (status !== currentStatus) {
        setStatus(currentStatus);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [event.date, event.startTime, event.endTime, status, event.status]);

  const handleViewEvent = () => {
    navigate(`/events/${event._id}`);
  };

  return (
    <div className="flex flex-col sm:flex-row bg-white dark:bg-zinc-900 rounded-lg shadow-md overflow-hidden mb-6 border border-zinc-200 dark:border-zinc-700 transition-shadow hover:shadow-lg">
      <div className="relative w-full sm:w-64 h-48 sm:h-auto bg-zinc-200 dark:bg-zinc-800 flex-shrink-0 group">
        <img
          src={event.thumbnail || '/no_image.png'}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/no_image.png';
          }}
          alt={event.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">
              {event.title}
            </h3>
            {status === 'live' && (
              <Badge variant="destructive" className="animate-pulse">Live</Badge>
            )}
            {status === 'completed' && (
              <Badge variant="secondary">Completed</Badge>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-3">
            {event.description}
          </p>
        </div>

        <div className="mt-auto space-y-3 pt-3">
          <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{convertUTCToLocal(event.date, event.startTime).displayDate}</span>
          </div>
          <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>{convertUTCToLocal(event.date, event.startTime).displayTime} - {convertUTCToLocal(event.date, event.endTime).displayTime}</span>
          </div>
          <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400">
            <Users className="w-4 h-4 mr-2" />
            <span>{event.registrationCount || 0} registered</span>
          </div>

          {user && user.role === 'participant' && (
            <div className="flex gap-2 pt-2">
              {status !== 'live' && (
                 <Button onClick={handleViewEvent} variant="outline" size="sm">
                   View Event
                 </Button>
              )}
              {status === 'live' && isRSVPd && (
                <a href={event.meetingLink} target="_blank" rel="noopener noreferrer">
                 <Button
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                  <Video className="w-4 h-4 mr-2" />
                   Join Live
                 </Button>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventCard; 