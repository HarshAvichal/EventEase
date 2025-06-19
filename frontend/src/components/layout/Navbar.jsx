import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Adjust path as needed

// Material UI Imports
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Handler for logo click
  const handleLogoClick = (e) => {
    if (isAuthenticated && user) {
      e.preventDefault();
      if (user.role === 'organizer') {
        navigate('/dashboard/organizer', { state: { sidebarOpen: true } });
      } else if (user.role === 'participant') {
        navigate('/dashboard/participant', { state: { sidebarOpen: true } });
      } else {
        navigate('/');
      }
    }
    // else, let Link handle navigation to home
  };

  return (
    <AppBar position="static" sx={{ bgcolor: '#212121' }}> {/* Darker background for AppBar */}
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          component={Link}
          to={
            isAuthenticated && user
              ? user.role === 'organizer'
                ? '/dashboard/organizer'
                : user.role === 'participant'
                ? '/dashboard/participant'
                : '/'
              : '/'
          }
          onClick={handleLogoClick}
          sx={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
        >
          EventEase
        </Typography>
        <Box>
          {!isAuthenticated && (
            <>
              <Button color="inherit" component={Link} to="/login" sx={{ mr: 2 }}>Login</Button>
              <Button color="inherit" component={Link} to="/signup" sx={{ mr: 2 }}>Signup</Button>
            </>
          )}

          {isAuthenticated && (
            <>
              {user && user.role === 'organizer' && (
                <>
                  <Button color="inherit" component={Link} to="/dashboard/organizer" sx={{ mr: 2 }}>Dashboard</Button>
                </>
              )}
              {user && user.role === 'participant' && (
                <>
                  <Button color="inherit" component={Link} to="/dashboard/participant" sx={{ mr: 2 }}>Dashboard</Button>
                </>
              )}
              <Button color="inherit" component={Link} to="/profile" sx={{ mr: 2 }}>Profile</Button>
              <Button color="inherit" onClick={logout}>Logout</Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 