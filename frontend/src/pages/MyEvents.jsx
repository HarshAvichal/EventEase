import { useNavigate } from 'react-router-dom';

const MyEvents = () => {
  const navigate = useNavigate();

  const handleEventClick = (eventId) => {
    navigate(`/event/${eventId}`, { state: { from: 'my-events' } });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event._id} onClick={() => handleEventClick(event._id)} className="cursor-pointer">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyEvents; 