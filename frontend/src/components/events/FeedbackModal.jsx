import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaStar, FaUsers } from 'react-icons/fa';
import { Loader2, X } from 'lucide-react';

const StarRating = ({ rating, setRating, readOnly = false, size = 'large' }) => {
  const [hover, setHover] = useState(null);
  const starSize = size === 'large' ? 'w-8 h-8' : 'w-4 h-4';

  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <label key={index}>
            <input
              type="radio"
              name="rating"
              value={ratingValue}
              onClick={() => !readOnly && setRating(ratingValue)}
              className="hidden"
            />
            <FaStar
              className={`cursor-pointer ${readOnly ? '' : 'transition-colors'}`}
              color={ratingValue <= (hover || rating) ? '#ffc107' : '#e4e5e9'}
              onMouseEnter={() => !readOnly && setHover(ratingValue)}
              onMouseLeave={() => !readOnly && setHover(null)}
              size={size === 'large' ? 24 : 16}
            />
          </label>
        );
      })}
    </div>
  );
};

const FeedbackModal = ({ open, onClose, event, participantId, authAxios, attendedCount }) => {
  const [activeTab, setActiveTab] = useState('give');
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [myFeedback, setMyFeedback] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isOrganizerView = !participantId;

  useEffect(() => {
    if (!event || !open) return;
    setLoading(true);
    setError('');
    setMyFeedback(null);
    setRating(0);
    setComment('');
    
    authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/feedback/${event._id || event.id}`)
      .then(res => {
        const feedback = res.data.feedback || [];
        setFeedbackList(feedback);
        if (!isOrganizerView) {
          const mine = feedback.find(fb => fb.participantId === participantId);
          if (mine) {
            setMyFeedback(mine);
            setRating(mine.rating);
            setComment(mine.comment);
          }
        }
      })
      .catch(() => setFeedbackList([]))
      .finally(() => setLoading(false));
  }, [event, open, participantId, authAxios, isOrganizerView]);

  useEffect(() => {
    if (open) {
      if (isOrganizerView) {
        setActiveTab('view');
      } else {
        // Default to 'give' for participants, but switch if they've already submitted
        const mine = feedbackList.find(fb => fb.participantId === participantId);
        setActiveTab(mine ? 'view' : 'give');
      }
    }
  }, [isOrganizerView, open, feedbackList, participantId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await authAxios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/feedback/${event._id || event.id}`, { rating, comment });
      setMyFeedback({ rating, comment, participantId });
      setActiveTab('view');
      const res = await authAxios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/events/feedback/${event._id || event.id}`);
      setFeedbackList(res.data.feedback || []);
    } catch (err) {
      setError('Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feedback for {event?.title}</DialogTitle>
        </DialogHeader>
        
        {isOrganizerView && (
          <div className="flex items-center gap-2 mb-4 text-zinc-600 dark:text-zinc-400">
            <FaUsers className="text-primary" />
            <span className="font-semibold">
              {event?.computedStatus === 'completed' && typeof attendedCount === 'number'
                ? attendedCount
                : event?.registrationCount || 0} Attended
            </span>
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            {!isOrganizerView && <TabsTrigger value="give">Give Feedback</TabsTrigger>}
            <TabsTrigger value="view" className={!isOrganizerView ? "" : "col-span-2"}>View Feedback</TabsTrigger>
          </TabsList>
          
          {!isOrganizerView && (
            <TabsContent value="give">
              {myFeedback ? (
                <p className="text-green-600 dark:text-green-400 p-4 text-center">You have already submitted feedback for this event.</p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div>
                    <p className="font-medium mb-2">Rating *</p>
                    <StarRating rating={rating} setRating={setRating} />
                  </div>
                  <Textarea
                    placeholder="Your comment *"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    required
                    rows={4}
                  />
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" disabled={submitting || !rating || !comment} className="w-full">
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Submit Feedback'}
                  </Button>
                </form>
              )}
            </TabsContent>
          )}

          <TabsContent value="view">
            {loading ? (
              <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-4 pt-4">
                {feedbackList.length === 0 ? (
                  <p className="text-zinc-500 text-center">No feedback yet.</p>
                ) : feedbackList.map((fb, idx) => (
                  <div key={idx} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-center mb-1">
                      <StarRating rating={fb.rating} readOnly size="small" />
                    </div>
                    <p className="text-sm mb-1">{fb.comment}</p>
                    <p className="text-xs text-zinc-500 text-right"> - {fb.participantName || 'Anonymous'}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="w-full"><X className="w-4 h-4 mr-2" />Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal; 