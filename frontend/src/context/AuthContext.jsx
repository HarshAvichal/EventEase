import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

// Move authAxios instance outside the component
const authAxios = axios.create();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Proactive token refresh timer
  let refreshTimer = null;

  // Helper to clear the timer
  const clearRefreshTimer = () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
  };

  // Set up proactive refresh after login or refresh
  const scheduleProactiveRefresh = () => {
    clearRefreshTimer();
    // Set to refresh 5 minutes before token expiry (2h - 5m = 115m = 6,900,000ms)
    refreshTimer = setTimeout(async () => {
      try {
        await refreshAccessToken();
        scheduleProactiveRefresh(); // Schedule next refresh
      } catch (e) {
        // If refresh fails, logout will be triggered in refreshAccessToken
      }
    }, 115 * 60 * 1000); // 115 minutes
  };

  // Call this after login or refresh
  useEffect(() => {
    if (isAuthenticated) {
      scheduleProactiveRefresh();
    } else {
      clearRefreshTimer();
    }
    return () => clearRefreshTimer();
  }, [isAuthenticated]);

  // Function to refresh the access token using the refresh token
  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error("No refresh token found.");
      }
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/refresh-token`, { refreshToken });
      const { accessToken, newRefreshToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken || refreshToken); // Update refresh token if a new one is provided

      return accessToken;
    } catch (error) {
      logout();
      throw error;
    }
  };

  // Axios Interceptor for automatic token refresh
  useEffect(() => {
    const requestInterceptor = authAxios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = authAxios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true; // Mark request as retried to prevent infinite loops
          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return authAxios(originalRequest); // Retry the original request with the new token
          } catch (refreshError) {
            return Promise.reject(refreshError); // Propagate the refresh error
          }
        }
        return Promise.reject(error); // For other errors or if already retried
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      authAxios.interceptors.request.eject(requestInterceptor);
      authAxios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Function to load user from localStorage (if token exists) or via API call
  const loadUser = async () => {
    setLoading(true);
    const token = localStorage.getItem('accessToken');

    if (token) {
      try {
        const response = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/me`);
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setIsAuthenticated(false);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = (userData, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(userData);
    setIsAuthenticated(true);
    scheduleProactiveRefresh();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUser(null);
    clearRefreshTimer();
    // Make an API call to invalidate token on the backend
    axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/logout`).catch(console.error);
  };

  const updateProfile = async (firstName, lastName) => {
    try {
      const response = await authAxios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/me`, {
        firstName,
        lastName
      });
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
      return response.data.user;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      await authAxios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/me`);
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete account';
      toast.error(message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout, loadUser, authAxios, updateProfile, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 