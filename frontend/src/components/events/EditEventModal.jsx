import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { convertLocalToUTC, convertUTCToLocal } from '../../utils/dateUtils';
import { Loader2, Save, X, Upload } from 'lucide-react';

dayjs.extend(customParseFormat);

const EditEventModal = ({ open, onClose, event, onEventUpdate }) => {
  const { authAxios } = useAuth();
  const fileInputRef = useRef(null);
  
  const [form, setForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    meetingLink: '',
    description: '',
    thumbnail: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      const { date: localDate, time: localStartTime } = convertUTCToLocal(event.date, event.startTime);
      const { time: localEndTime } = convertUTCToLocal(event.date, event.endTime);

      setForm({
        title: event.title || '',
        date: dayjs(localDate).format('YYYY-MM-DD'),
        startTime: localStartTime || '',
        endTime: localEndTime || '',
        meetingLink: event.meetingLink || '',
        description: event.description || '',
        thumbnail: event.thumbnail || '',
      });
      setThumbnailFile(null); 
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
    }
  };

  const handleThumbnailButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let thumbnailUrl = event.thumbnail; 

      if (thumbnailFile) {
        const data = new FormData();
        data.append('file', thumbnailFile);
        data.append('upload_preset', 'eventease_present');
        const uploadRes = await axios.post('https://api.cloudinary.com/v1_1/da6kpwqmh/image/upload', data);
        thumbnailUrl = uploadRes.data.secure_url;
      }
      
      const { date: utcDate, time: utcStartTime } = convertLocalToUTC(form.date, form.startTime);
      const { time: utcEndTime } = convertLocalToUTC(form.date, form.endTime);
      
      const updatedEventData = {
        title: form.title,
        description: form.description,
        meetingLink: form.meetingLink,
        thumbnail: thumbnailUrl,
        date: utcDate,
        startTime: utcStartTime,
        endTime: utcEndTime,
      };

      await authAxios.patch(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/events/${event._id}`,
        updatedEventData
      );

      toast.success('Event updated successfully!');
      onEventUpdate();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Make changes to your event here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={form.title} onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" value={form.date} onChange={handleChange} required />
            </div>
             <div className="space-y-2">
              <Label htmlFor="startTime">Time</Label>
               <div className="grid grid-cols-2 gap-2">
                <Input id="startTime" name="startTime" type="time" value={form.startTime} onChange={handleChange} required />
                <Input id="endTime" name="endTime" type="time" value={form.endTime} onChange={handleChange} required />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meetingLink">Meeting Link</Label>
            <Input id="meetingLink" name="meetingLink" value={form.meetingLink} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} required />
          </div>
          <div className="space-y-2">
            <Label>Thumbnail (Optional)</Label>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" onClick={handleThumbnailButtonClick} className="flex-shrink-0">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <span className="text-sm text-zinc-500 truncate">
                {thumbnailFile ? thumbnailFile.name : (form.thumbnail ? 'Current image retained' : 'No file selected')}
              </span>
            </div>
            <input id="thumbnail-upload" type="file" ref={fileInputRef} onChange={handleThumbnailChange} accept="image/*" className="hidden"/>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button type="button" variant="outline"><X className="w-4 h-4 mr-2" />Cancel</Button></DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal; 