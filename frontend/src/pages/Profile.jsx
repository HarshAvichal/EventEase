import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  Edit,
  Trash2,
  User,
  Mail,
  Shield,
  Save,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

function Profile() {
  const { user, updateProfile, deleteAccount, loading } = useAuth();
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || ''
  });
  
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleEditChange = (field) => (event) => {
    setEditForm(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

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

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;
    
    setEditLoading(true);
    try {
      await updateProfile(editForm.firstName.trim(), editForm.lastName.trim());
      setEditModalOpen(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Profile update failed.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await deleteAccount();
      // Navigation is handled by logout in AuthContext
    } catch (error) {
      toast.error('Account deletion failed.');
    } finally {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  };

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
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          User not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-center sm:text-left">
        Profile Settings
      </h1>

      <Card className="shadow-lg border-zinc-200 dark:border-zinc-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
            <Avatar className="w-24 h-24 text-4xl">
              <AvatarFallback>{user.firstName?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
              <Badge variant={user.role === 'organizer' ? 'default' : 'secondary'} className="mt-1">
                {user.role === 'organizer' ? 'Event Organizer' : 'Event Participant'}
              </Badge>
            </div>
          </div>
          <hr className="my-6 border-zinc-200 dark:border-zinc-700" />
          <div>
            <h3 className="text-xl font-semibold mb-4">Account Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <User className="w-5 h-5 text-zinc-500" />
                <div>
                  <p className="text-sm text-zinc-500">Full Name</p>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="w-5 h-5 text-zinc-500" />
                <div>
                  <p className="text-sm text-zinc-500">Email Address</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 text-zinc-500" />
                <div>
                  <p className="text-sm text-zinc-500">Account Type</p>
                  <p className="font-medium">{user.role === 'organizer' ? 'Event Organizer' : 'Event Participant'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
        <Button onClick={openEditModal} className="w-full sm:w-auto">
          <Edit className="w-4 h-4 mr-2" /> Edit Profile
        </Button>
        <Button variant="destructive" onClick={() => setDeleteModalOpen(true)} className="w-full sm:w-auto">
          <Trash2 className="w-4 h-4 mr-2" /> Delete Account
        </Button>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input id="firstName" value={editForm.firstName} onChange={handleEditChange('firstName')} className="col-span-3" />
              {errors.firstName && <p className="col-span-4 text-sm text-red-500 text-right">{errors.firstName}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input id="lastName" value={editForm.lastName} onChange={handleEditChange('lastName')} className="col-span-3" />
              {errors.lastName && <p className="col-span-4 text-sm text-red-500 text-right">{errors.lastName}</p>}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline"><X className="w-4 h-4 mr-2" />Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateProfile} disabled={editLoading}>
              {editLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Account Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-destructive" /> Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data, including events and RSVPs, will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <p className="my-4">Are you sure you want to delete your account?</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline"><X className="w-4 h-4 mr-2" />Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteLoading}>
              {deleteLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Profile; 