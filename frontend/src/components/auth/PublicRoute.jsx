import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute = () => {
  const { isAuthenticated, user } = useAuth();

  // If the user is authenticated, redirect them to their dashboard
  if (isAuthenticated && user) {
    if (user.role === 'organizer') {
      return <Navigate to="/organizer/dashboard" replace />;
    }
    return <Navigate to="/participant/dashboard" replace />;
  }

  // If not authenticated, render the children (e.g., Login or Signup component)
  return <Outlet />;
};

export default PublicRoute; 