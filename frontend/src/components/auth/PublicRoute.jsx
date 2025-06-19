import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // While authentication status is being determined, show nothing or a loader
  if (loading) {
    return <div>Loading authentication...</div>; // Or a more sophisticated loader
  }

  // If the user is authenticated, redirect them to their dashboard
  if (isAuthenticated && user) {
    if (user.role === 'organizer') {
      return <Navigate to="/dashboard/organizer" replace />;
    } else if (user.role === 'participant') {
      return <Navigate to="/dashboard/participant" replace />;
    } else {
      // Fallback for unexpected roles or if role is not available
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If not authenticated, render the children (e.g., Login or Signup component)
  return <Outlet />;
};

export default PublicRoute; 