import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user) {
    if (user.role === 'organizer') {
      return <Navigate to="/dashboard/organizer" replace />;
    } else if (user.role === 'participant') {
      return <Navigate to="/dashboard/participant" replace />;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-5xl font-bold text-gray-800 mb-4">Welcome to EventEase!</h1>
      <p className="text-lg text-gray-600">Your ultimate platform for managing and discovering events.</p>
    </div>
  );
}

export default Home; 