import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

function Profile() {
  const { user, updateProfile, deleteAccount, loading } = useAuth();
  const navigate = useNavigate();
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Handle edit form changes
  const handleEditChange = (field) => (event) => {
    setEditForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Validate edit form
  const validateForm = () => {
    const newErrors = {};
    if (!editForm.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!/^[a-zA-Z]+$/.test(editForm.firstName.trim())) {
      newErrors.firstName = 'First name must contain only letters';
    }
    if (!editForm.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!/^[a-zA-Z]+$/.test(editForm.lastName.trim())) {
      newErrors.lastName = 'Last name must contain only letters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!validateForm()) return;
    
    setEditLoading(true);
    try {
      await updateProfile(editForm.firstName.trim(), editForm.lastName.trim());
      setEditModalOpen(false);
      setEditForm({
        firstName: user?.firstName || '',
        lastName: user?.lastName || ''
      });
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setEditLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      // Navigation will be handled by logout in AuthContext
    } catch (error) {
      console.error('Account deletion failed:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Open edit modal and populate form
  const openEditModal = () => {
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || ''
    });
    setErrors({});
    setEditModalOpen(true);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Alert severity="error">User not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: 'calc(100vh - 64px)', 
      bgcolor: '#f5f5f5', 
      py: 4, 
      px: { xs: 2, sm: 4, md: 6 } 
    }}>
      <Box maxWidth="800px" mx="auto">
        {/* Header */}
        <Typography variant="h4" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold', 
          color: '#1a237e',
          mb: 3,
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          Profile Settings
        </Typography>

        {/* Profile Card */}
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  bgcolor: '#1a237e',
                  fontSize: '2rem',
                  mr: 3
                }}
              >
                {user.firstName?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {user.firstName} {user.lastName}
                </Typography>
                <Chip 
                  label={user.role === 'organizer' ? 'Event Organizer' : 'Event Participant'}
                  color={user.role === 'organizer' ? 'primary' : 'secondary'}
                  size="small"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Profile Information */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Account Information
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 2, color: '#666' }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">Full Name</Typography>
                  <Typography variant="body1">{user.firstName} {user.lastName}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EmailIcon sx={{ mr: 2, color: '#666' }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">Email Address</Typography>
                  <Typography variant="body1">{user.email}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BadgeIcon sx={{ mr: 2, color: '#666' }} />
                <Box>
                  <Typography variant="body2" color="textSecondary">Account Type</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {user.role}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={openEditModal}
                sx={{ 
                  bgcolor: '#1a237e',
                  '&:hover': { bgcolor: '#0d47a1' }
                }}
              >
                Edit Profile
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteModalOpen(true)}
                sx={{ borderColor: '#d32f2f', color: '#d32f2f' }}
              >
                Delete Account
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card sx={{ boxShadow: 2 }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <WarningIcon sx={{ color: '#ff9800', mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Security Notice
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Your account information is secure and protected. Email addresses cannot be changed for security reasons. 
              If you need to change your email, please contact support.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Edit Profile Modal */}
      <Dialog 
        open={editModalOpen} 
        onClose={() => setEditModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#1a237e', color: 'white' }}>
          Edit Profile
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            fullWidth
            label="First Name"
            value={editForm.firstName}
            onChange={handleEditChange('firstName')}
            error={!!errors.firstName}
            helperText={errors.firstName}
            margin="normal"
            disabled={editLoading}
          />
          <TextField
            fullWidth
            label="Last Name"
            value={editForm.lastName}
            onChange={handleEditChange('lastName')}
            error={!!errors.lastName}
            helperText={errors.lastName}
            margin="normal"
            disabled={editLoading}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setEditModalOpen(false)}
            disabled={editLoading}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProfile}
            variant="contained"
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={20} /> : <SaveIcon />}
            sx={{ bgcolor: '#1a237e' }}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Confirmation Modal */}
      <Dialog 
        open={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white' }}>
          Delete Account
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
              This action cannot be undone!
            </Typography>
            <Typography variant="body2">
              Deleting your account will permanently remove:
            </Typography>
            <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>All your personal information</li>
              <li>All your RSVPs to events</li>
              {user.role === 'organizer' && (
                <li>All events you have created</li>
              )}
              <li>All associated data</li>
            </ul>
          </Alert>
          <Typography variant="body2" color="textSecondary">
            Are you absolutely sure you want to delete your account? This action is irreversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            disabled={deleteLoading}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="contained"
            color="error"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Profile; 