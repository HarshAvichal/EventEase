import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layout Components
import Navbar from './components/layout/Navbar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EventDetails from './pages/EventDetails';
import CreateEvent from './pages/CreateEvent';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Organizer Pages
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import UpcomingEvents from './pages/organizer/events/UpcomingEvents';
import CompletedEvents from './pages/organizer/events/CompletedEvents';
import AllUpcomingEvents from './pages/organizer/events/AllUpcomingEvents';
import LiveEvents from './pages/organizer/events/LiveEvents';

// Participant Pages
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import ParticipantUpcomingEvents from './pages/participant/UpcomingEvents';
import ParticipantMyEvents from './pages/participant/MyEvents';
import ParticipantCompletedEvents from './pages/participant/CompletedEvents';

// Auth Components
import PrivateRoute from './components/auth/PrivateRoute';
import PublicRoute from './components/auth/PublicRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              {/* Public Routes - Accessible only if not authenticated */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
              </Route>
              <Route path="/events/:eventId" element={<EventDetails />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute allowedRoles={['organizer', 'participant']} />}>
                {/* Organizer Dashboard and nested routes */}
                <Route path="/dashboard/organizer" element={<OrganizerDashboard />}>
                  {/* Add specific components for each organizer dashboard view */}
                  <Route index element={<div>Select an option from the sidebar to manage your events.</div>} /> {/* Default content for /dashboard/organizer */}
                  <Route path="create-event" element={<CreateEvent />} />
                  <Route path="upcoming" element={<UpcomingEvents />} />
                  <Route path="completed" element={<CompletedEvents />} />
                  <Route path="upcoming/all" element={<AllUpcomingEvents />} />
                  <Route path="live" element={<LiveEvents />} />
                </Route>
                
                {/* Participant Dashboard with sidebar and nested routes */}
                <Route path="/dashboard/participant" element={<ParticipantDashboard />}>
                  <Route index element={<ParticipantUpcomingEvents />} />
                  <Route path="upcoming" element={<ParticipantUpcomingEvents />} />
                  <Route path="my-events" element={<ParticipantMyEvents />} />
                  <Route path="completed" element={<ParticipantCompletedEvents />} />
                </Route>

                {/* These might be direct links for organizers/participants or accessible globally if needed */}
                <Route path="/profile" element={<Profile />} />
              </Route>
              
              {/* Catch-all for 404 or redirect to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
          <Toaster position="top-right" />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
