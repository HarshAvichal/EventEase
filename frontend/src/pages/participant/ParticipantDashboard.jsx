import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, Loader2 } from 'lucide-react';

function ParticipantDashboard() {
  const { user, authAxios, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar
  const [hasLiveEvents, setHasLiveEvents] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let intervalId;
    const fetchLiveEvents = async () => {
      try {
        const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/participant/my-events`);
        setHasLiveEvents((res.data.myEvents?.live?.length || 0) > 0);
      } catch {
        setHasLiveEvents(false);
      }
    };
    if (user && user.role === 'participant') {
      fetchLiveEvents();
      intervalId = setInterval(fetchLiveEvents, 20000);
    }
    return () => clearInterval(intervalId);
  }, [user, user?.role, location.pathname, authAxios]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== 'participant') {
    return <Navigate to="/" replace />;
  }

  const navLinks = [
    { to: 'upcoming', label: 'Upcoming Events' },
    { to: 'my-events', label: 'My Events', live: true },
    { to: 'completed', label: 'Completed Events' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-6">
        <h3 className="text-xl font-semibold mb-6 text-zinc-800 dark:text-zinc-100">Participant Menu</h3>
        <nav>
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  replace={true}
                  className="flex items-center w-full p-2 rounded-md text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors duration-200"
                >
                  <span>{link.label}</span>
                  {link.to === 'my-events' && hasLiveEvents && (
                    <span className="ml-auto flex-shrink-0">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
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
                <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">Participant Menu</h3>
                <button onClick={() => setSidebarOpen(false)} aria-label="Close menu">
                  <X className="w-6 h-6 text-zinc-800 dark:text-zinc-100" />
                </button>
              </div>
              <nav>
                <ul className="space-y-2">
                  {navLinks.map((link) => (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        replace={true}
                        className="flex items-center w-full p-2 rounded-md text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors duration-200"
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span>{link.label}</span>
                        {link.to === 'my-events' && hasLiveEvents && (
                          <span className="ml-auto flex-shrink-0">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 transition-all duration-300 ease-in-out">
        <div className="flex items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-800 dark:text-zinc-100">Participant Dashboard</h2>
        </div>
        <p className="text-zinc-600 dark:text-zinc-300">Welcome, {user.firstName} {user.lastName}! Use the sidebar to browse and manage your events.</p>
        <div className="mt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default ParticipantDashboard; 