import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UpcomingEvents from './events/UpcomingEvents';
import CompletedEvents from './events/CompletedEvents';
import { EventsProvider, useEvents } from '../../context/EventsContext';

function SidebarLiveIndicator() {
  const { events } = useEvents();
  const hasLive = events.some(event => event.computedStatus === 'live');
  return hasLive ? (
    <span className="ml-2 align-middle">
      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
    </span>
  ) : null;
}

function OrganizerDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true); // State to manage sidebar visibility

  // Open sidebar if navigated from Navbar logo
  useEffect(() => {
    if (location.state && location.state.sidebarOpen) {
      setSidebarOpen(true);
    }
  }, [location.state]);

  if (!user || user.role !== 'organizer') {
    // This case should ideally be handled by PrivateRoute, but as a fallback:
    return <p>Access Denied: You must be an organizer to view this page.</p>;
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-md p-6 transform transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full overflow-hidden'}`}
      >
        <h3 className="text-xl font-semibold mb-6 text-gray-800">Organizer Menu</h3>
        <EventsProvider>
        <nav>
          <ul>
            <li className="mb-3">
              <Link to="create-event" replace={true} className="block p-2 rounded-md text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200" onClick={toggleSidebar}>
                Create Event
              </Link>
            </li>
            <li className="mb-3">
              <Link to="upcoming" replace={true} className="block p-2 rounded-md text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200" onClick={toggleSidebar}>
                Upcoming Events
              </Link>
            </li>
            <li className="mb-3 flex items-center">
              <Link to="live" replace={true} className="block p-2 rounded-md text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200" onClick={toggleSidebar}>
                Live Events
              </Link>
              <SidebarLiveIndicator />
            </li>
            <li className="mb-3">
              <Link to="completed" replace={true} className="block p-2 rounded-md text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200" onClick={toggleSidebar}>
                Completed Events
              </Link>
            </li>
          </ul>
        </nav>
        </EventsProvider>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 transition-all duration-300 ease-in-out">
        <div className="flex items-center mb-6">
          <button onClick={toggleSidebar} className="p-2 text-gray-600 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-3xl font-bold text-gray-800">Organizer Dashboard</h2>
        </div>
        <p className="text-gray-600">Welcome, {user.firstName} {user.lastName}! Use the sidebar to manage your events.</p>
        {/* Render child routes here */}
        <EventsProvider>
          <div className="mt-8">
            <Outlet />
          </div>
        </EventsProvider>
      </main>
    </div>
  );
}

export default OrganizerDashboard; 