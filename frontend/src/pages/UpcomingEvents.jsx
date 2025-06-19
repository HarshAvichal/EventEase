import { useEffect } from 'react';

const UpcomingEvents = () => {
  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      window.history.pushState(null, '', '/');
    };

    window.history.pushState(null, '', '/');
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Upcoming Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event._id} onClick={() => navigate(`/event/${event._id}`, { state: { from: 'upcoming-events' } })} className="cursor-pointer">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </div>
  );
}; 