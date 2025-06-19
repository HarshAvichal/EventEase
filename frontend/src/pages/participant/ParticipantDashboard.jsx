import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function ParticipantDashboard() {
  const { user, authAxios } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasLiveEvents, setHasLiveEvents] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let intervalId;
    const fetchLiveEvents = async () => {
      try {
        const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/participant/my-events`);
        console.log('Sidebar my-events API:', res.data.myEvents);
        setHasLiveEvents((res.data.myEvents?.live?.length || 0) > 0);
      } catch {
        setHasLiveEvents(false);
      }
    };
    if (user && user.role === 'participant') {
      fetchLiveEvents();
      intervalId = setInterval(fetchLiveEvents, 20000); // 20 seconds
    }
    return () => clearInterval(intervalId);
  }, [user, user?.role, location.pathname, authAxios]);

  if (!user || user.role !== 'participant') {
    return <Navigate to="/" replace />;
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`bg-white shadow-md p-6 transform transition-all duration-500 ease-in-out ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full overflow-hidden'}`}>
        <h3 className="text-xl font-semibold mb-6 text-gray-800">Participant Menu</h3>
        <nav>
          <ul>
            <li className="mb-3">
              <Link to="upcoming" replace={true} className="block p-2 rounded-md text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200" onClick={toggleSidebar}>
                Upcoming Events
              </Link>
            </li>
            <li className="mb-3">
              <Link to="my-events" replace={true} className="flex p-2 rounded-md text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200 items-center" onClick={toggleSidebar}>
                My Events
                {hasLiveEvents && (
                  <span className="ml-2 flex items-center align-middle">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  </span>
                )}
              </Link>
            </li>
            <li className="mb-3">
              <Link to="completed" replace={true} className="block p-2 rounded-md text-gray-700 hover:bg-indigo-100 hover:text-indigo-700 transition-colors duration-200" onClick={toggleSidebar}>
                Completed Events
              </Link>
            </li>
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 transition-all duration-300 ease-in-out">
        <div className="flex items-center mb-6">
          <button onClick={toggleSidebar} className="p-2 text-gray-600 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 mr-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="text-3xl font-bold text-gray-800">Participant Dashboard</h2>
        </div>
        <p className="text-gray-600">Welcome, {user.firstName} {user.lastName}! Use the sidebar to browse and manage your events.</p>
        <div className="mt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default ParticipantDashboard; 