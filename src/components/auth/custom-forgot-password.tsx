"use client";

import React, { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
import LuxuryInput from './luxury-input';
import LuxuryButton from './luxury-button';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CustomForgotPassword() {
  const { isLoaded, signIn } = useSignIn();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn) return;
    
    // Clear previous errors
    setErrors({});
    setSuccessMessage('');
    
    // Validate
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }
    
    setLoading(true);
    
    try {
      // Create a password reset flow
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });

      // Show success message
      setSuccessMessage('Password reset instructions have been sent to your email.');
      toast.success('Check your email for the verification code');
      
      // Redirect to reset password page after a short delay
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (err: any) {
      
      
      if (err.errors) {
        const emailError = err.errors.find((e: any) => 
          e.meta?.paramName === 'identifier' || e.code === 'form_identifier_not_found'
        );
        
        if (emailError) {
          setErrors({ email: emailError.longMessage || 'Email address not found' });
        } else {
          toast.error(err.errors[0]?.longMessage || 'Failed to send reset instructions');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      <Link 
        href="/sign-in" 
        className="inline-flex items-center text-sm text-gray-600 hover:text-[#B5985A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to sign in
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-serif text-[#0A0A0A]">Reset Your Password</h1>
        <p className="text-gray-600 text-lg">
          Enter your email address and we'll send you a verification code
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-800 text-sm">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <LuxuryInput
          label="Email address"
          type="email"
          icon={<Mail className="w-5 h-5" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          disabled={loading || !!successMessage}
          placeholder="Enter your registered email"
        />

        <LuxuryButton
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
          disabled={!!successMessage}
        >
          Send Reset Instructions
        </LuxuryButton>
      </form>

      <div className="text-center space-y-2">
        <p className="text-gray-600">
          Remember your password?{' '}
          <Link href="/sign-in" className="text-[#B5985A] hover:text-[#B5985A]/80 font-medium transition-colors">
            Sign in
          </Link>
        </p>
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link href="/sign-up" className="text-[#B5985A] hover:text-[#B5985A]/80 font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}