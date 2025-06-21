import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, Mail } from 'lucide-react';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/forgot-password`, {
        email: email.trim()
      });

      if (response.data.success) {
        toast.success('Password reset link sent to your email!');
        setIsSubmitted(true);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <Card className="shadow-lg border-zinc-200 dark:border-zinc-700 w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
              Check Your Email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-zinc-600 dark:text-zinc-400">
              We've sent a password reset link to <strong className="text-zinc-900 dark:text-zinc-100">{email}</strong>
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Please check your email and click the link to reset your password. 
              If you don't see the email, check your spam folder.
            </p>
            <Button asChild className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
      <Card className="shadow-lg border-zinc-200 dark:border-zinc-700 w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                required
                autoFocus
                className={error ? "border-red-500" : ""}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Send Reset Link
                </>
              )}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Remember your password?{' '}
                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                  Login
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ForgotPassword; 