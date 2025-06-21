import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EventsProvider, useEvents } from '../../context/EventsContext';
import { Menu, X } from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar

  // Open sidebar if navigated from Navbar logo
  useEffect(() => {
    if (location.state && location.state.sidebarOpen) {
      setSidebarOpen(true);
    }
  }, [location.state]);

  if (!user || user.role !== 'organizer') {
    return <p className="text-center text-red-500 py-8">Access Denied: You must be an organizer to view this page.</p>;
  }

  const navLinks = [
    { to: 'create-event', label: 'Create Event' },
    { to: 'upcoming', label: 'Upcoming Events' },
    { to: 'live', label: 'Live Events', live: true },
    { to: 'completed', label: 'Completed Events' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">Organizer Menu</h3>
        <EventsProvider>
          <nav>
            <ul className="space-y-2">
              {navLinks.map((link, idx) => (
                <li key={link.to} className="flex items-center">
                  <Link
                    to={link.to}
                    replace={true}
                    className="block w-full p-2 rounded-md text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                  {link.live && <SidebarLiveIndicator />}
                </li>
              ))}
            </ul>
          </nav>
        </EventsProvider>
      </aside>

      {/* Sidebar (mobile) */}
      <div className="md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded bg-white dark:bg-zinc-900 shadow-md border border-zinc-200 dark:border-zinc-800 focus:outline-none"
        >
          <Menu className="w-6 h-6 text-zinc-800 dark:text-zinc-100" />
        </button>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setSidebarOpen(false)}>
            <aside
              className="absolute top-0 left-0 w-64 h-full bg-white dark:bg-zinc-900 shadow-lg flex flex-col p-6 animate-in slide-in-from-left-20"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Organizer Menu</h3>
                <button onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                  <X className="w-6 h-6 text-zinc-800 dark:text-zinc-100" />
                </button>
              </div>
              <EventsProvider>
                <nav>
                  <ul className="space-y-2">
                    {navLinks.map((link, idx) => (
                      <li key={link.to} className="flex items-center">
                        <Link
                          to={link.to}
                          replace={true}
                          className="block w-full p-2 rounded-md text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors duration-200"
                          onClick={() => setSidebarOpen(false)}
                        >
                          {link.label}
                        </Link>
                        {link.live && <SidebarLiveIndicator />}
                      </li>
                    ))}
                  </ul>
                </nav>
              </EventsProvider>
            </aside>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 transition-all duration-300 ease-in-out">
        <div className="flex items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-800 dark:text-zinc-100">Organizer Dashboard</h2>
        </div>
        <p className="text-zinc-600 dark:text-zinc-300">Welcome, {user.firstName} {user.lastName}! Use the sidebar to manage your events.</p>
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