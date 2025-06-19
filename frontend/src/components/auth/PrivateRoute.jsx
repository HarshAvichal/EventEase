import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    // Optionally render a loading spinner or placeholder
    return <div>Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    // User is not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // User is authenticated but does not have an allowed role, redirect to unauthorized page or dashboard
    // For now, let's redirect to login, or you can create a /unauthorized page
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and has the correct role, render the child routes
  return <Outlet />;
};

export default PrivateRoute; 