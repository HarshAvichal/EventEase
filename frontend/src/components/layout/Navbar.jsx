import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X } from 'lucide-react';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
  };

  return (
    <nav className="w-full bg-zinc-900 text-white border-b border-zinc-800 sticky top-0 z-30">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link
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
          className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
        >
          EventEase
        </Link>

        <div className="flex items-center gap-4">
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {!isAuthenticated && (
              <>
                <Link to="/login" className="px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Login</Link>
                <Link to="/signup" className="px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Signup</Link>
              </>
            )}
            {isAuthenticated && (
              <>
                {user && user.role === 'organizer' && (
                  <Link to="/dashboard/organizer" className="px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Dashboard</Link>
                )}
                {user && user.role === 'participant' && (
                  <Link to="/dashboard/participant" className="px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Dashboard</Link>
                )}
                <Link to="/profile" className="px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Profile</Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>
          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center p-2 rounded hover:bg-zinc-800 transition ml-auto"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-0 right-0 w-64 h-full bg-zinc-900 shadow-lg flex flex-col p-6 gap-2 animate-in slide-in-from-right-20"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg">EventEase</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {!isAuthenticated && (
                <>
                  <button onClick={() => handleNavigation('/login')} className="text-left px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Login</button>
                  <button onClick={() => handleNavigation('/signup')} className="text-left px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Signup</button>
                </>
              )}
              {isAuthenticated && (
                <>
                  {user && user.role === 'organizer' && (
                    <button onClick={() => handleNavigation('/dashboard/organizer')} className="text-left px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Dashboard</button>
                  )}
                  {user && user.role === 'participant' && (
                    <button onClick={() => handleNavigation('/dashboard/participant')} className="text-left px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Dashboard</button>
                  )}
                  <button onClick={() => handleNavigation('/profile')} className="text-left px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Profile</button>
                  <div className="border-t border-zinc-800 my-2" />
                  <button onClick={handleLogout} className="text-left px-3 py-2 rounded hover:bg-zinc-800 transition text-sm font-medium">Logout</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar; 