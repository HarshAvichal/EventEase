import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaRegCalendarAlt, FaRegClock, FaUsers } from 'react-icons/fa';
import dayjs from 'dayjs';

function EventCard({ event, participantCount, onRegister, isRSVPd, isLive, onJoin }) {
  const navigate = useNavigate();
  console.log('EventCard render:', event.title, 'isLive:', isLive, 'isRSVPd:', isRSVPd);
  if (isLive) {
    console.log('Live EventCard event:', event);
  }
  return (
    <div className="flex flex-col bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="text-xs text-gray-500 font-medium mb-2 flex items-center">
        Organizer: {event.organizerId?.firstName
          ? `${event.organizerId.firstName} ${event.organizerId.lastName}`
          : event.organizerName || event.organizer || 'Unknown'}
        {isLive && (
          <span className="ml-2 flex items-center align-middle">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          </span>
        )}
      </div>
      <div className="flex items-center">
        <img
          src={event.thumbnail}
          alt={event.title}
          className="w-40 h-28 object-cover rounded-md mr-6"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap">
            <Link to={`/events/${event._id}`} className="text-xl font-bold text-blue-800 truncate hover:underline">
              {event.title}
            </Link>
          </div>
          <div className="flex items-center text-gray-600 mt-1 text-sm flex-wrap">
            <span className="mr-2 flex items-center"><FaRegCalendarAlt className="mr-1" /> {dayjs(event.date + 'T' + event.startTime).format('ddd, MMM D, YYYY')}</span>
            <span className="mr-2 flex items-center"><FaRegClock className="mr-1" /> {dayjs(event.date + 'T' + event.startTime).format('hh:mm A')} - {dayjs(event.date + 'T' + event.endTime).format('hh:mm A')}</span>
          </div>
          <div className="flex items-center mt-2 flex-wrap">
            {event.tags && event.tags.map((tag, idx) => (
              <span key={idx} className="bg-gray-200 text-gray-700 px-2 py-1 rounded mr-2 mb-1 text-xs font-medium">{tag}</span>
            ))}
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className="flex items-center mr-4">
              <FaUsers className="mr-1" />
              {participantCount !== undefined ? `${participantCount} going` : 'Loading...'}
            </span>
            <span className="ml-2 text-green-700 font-semibold">
              {event.price ? `₹${event.price}` : 'FREE'}
            </span>
          </div>
        </div>
        {isLive ? (
          event.meetingLink && event.meetingLink.startsWith('https://meet.jit.si/') ? (
            <>
              <style>{`
                @keyframes radiate {
                  0% { box-shadow: 0 0 0 0 rgba(239,68,68, 0.7); }
                  70% { box-shadow: 0 0 0 10px rgba(239,68,68, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(239,68,68, 0); }
                }
              `}</style>
              <a
                href={event.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-6 px-5 py-2 rounded font-bold text-white shadow-lg focus:ring-2 focus:ring-red-400 focus:outline-none"
                style={{
                  background: '#ef4444',
                  animation: 'radiate 1s infinite',
                  fontWeight: 'bold',
                  boxShadow: '0 0 0 0 rgba(239,68,68, 0.7)',
                }}
              >
                LIVE
              </a>
            </>
          ) : (
            <button
              className="ml-6 px-5 py-2 rounded font-semibold bg-gray-400 text-white cursor-not-allowed"
              disabled
              title="Meeting link not available"
            >
              LIVE
            </button>
          )
        ) : (
          <button
            className="ml-6 px-4 py-2 rounded font-semibold transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => navigate(`/events/${event._id}`)}
          >
            View Event
          </button>
        )}
      </div>
    </div>
  );
}

export default EventCard; 