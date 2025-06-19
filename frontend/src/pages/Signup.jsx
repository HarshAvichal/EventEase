import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

// Material UI Imports
import { TextField, Button, Box, Typography, Container, CircularProgress, MenuItem, Select, InputLabel, FormControl } from '@mui/material';

function Signup() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'participant', // Default role
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth(); // Destructure login from useAuth

  const validateForm = () => {
    const newErrors = {};
    
    const nameRegex = /^[a-zA-Z]+$/;

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!nameRegex.test(formData.firstName.trim())) {
      newErrors.firstName = 'First name must contain only letters';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!nameRegex.test(formData.lastName.trim())) {
      newErrors.lastName = 'Last name must contain only letters';
    }
    
    const emailRegex = /^[^\s@]+@gmail\.com$/;
    if (!formData.email.match(emailRegex)) {
      newErrors.email = 'Please enter a valid Gmail address (e.g., example@gmail.com)';
    }
    
    if (formData.password.length < 8 ||
        !/[A-Z]/.test(formData.password) ||
        !/[a-z]/.test(formData.password) ||
        !/\d/.test(formData.password) ||
        !/[@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character (e.g., @$!%*?&).';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/signup`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      });
      
      const { accessToken, refreshToken, user } = response.data; // Destructure data from response
      login(user, accessToken, refreshToken); // Log user in via AuthContext

      toast.success('Registration successful!');
      // Navigate based on role
      if (user.role === 'organizer') {
        navigate('/dashboard/organizer');
      } else if (user.role === 'participant') {
        navigate('/dashboard/participant');
      } else {
        navigate('/dashboard'); // Fallback
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 4,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 3,
      }}>
        <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
            Create your account
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Or {' '}
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button variant="text" sx={{ textTransform: 'none', p: 0 }}>sign in to your existing account</Button>
          </Link>
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="firstName"
            label="First Name"
            name="firstName"
            autoComplete="given-name"
            value={formData.firstName}
            onChange={handleChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
                required
            fullWidth
            id="lastName"
            label="Last Name"
            name="lastName"
            autoComplete="family-name"
            value={formData.lastName}
                onChange={handleChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
            sx={{ mb: 2 }}
              />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
                name="password"
            label="Password"
                type="password"
            id="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
                name="confirmPassword"
            label="Confirm Password"
                type="password"
            id="confirmPassword"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
            <InputLabel id="role-select-label">I want to join as</InputLabel>
            <Select
              labelId="role-select-label"
              id="role"
              name="role"
              value={formData.role}
              label="I want to join as"
              onChange={handleChange}
            >
              <MenuItem value="participant">Participant</MenuItem>
              <MenuItem value="organizer">Organizer</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default Signup; 