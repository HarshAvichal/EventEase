import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';

function Home() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto py-8 md:py-12 px-4 md:px-6">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-indigo-700 dark:text-indigo-400 mb-4 md:mb-6 leading-tight">
          Welcome to EventEase
        </h1>
        
        <h2 className="text-lg md:text-2xl lg:text-3xl text-zinc-600 dark:text-zinc-400 mb-6 md:mb-8 lg:mb-10 leading-relaxed">
          Create, discover, and join amazing events with ease
        </h2>
        
        <p className="text-base md:text-lg mb-8 md:mb-10 lg:mb-12 leading-relaxed text-zinc-600 dark:text-zinc-400">
          Whether you're an organizer looking to host events or a participant eager to join exciting gatherings, 
          EventEase provides the perfect platform for seamless event management and participation.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center items-center">
          {!isAuthenticated ? (
            <>
              <Button
                asChild
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 md:px-8 text-lg font-semibold"
              >
                <Link to="/signup">
                  Get Started
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full sm:w-auto text-indigo-700 dark:text-indigo-400 border-indigo-700 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 py-3 px-6 md:px-8 text-lg font-semibold"
              >
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </>
          ) : (
            <Button
              asChild
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 md:px-8 text-lg font-semibold"
            >
              <Link to={user?.role === 'organizer' ? '/dashboard/organizer' : '/dashboard/participant'}>
                Go to Dashboard
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home; 