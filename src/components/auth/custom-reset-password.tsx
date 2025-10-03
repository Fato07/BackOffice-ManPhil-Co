"use client";

import React, { useState, useEffect } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import LuxuryInput from './luxury-input';
import LuxuryButton from './luxury-button';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CustomResetPassword() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ 
    code?: string; 
    password?: string; 
    confirmPassword?: string; 
  }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Get email from query params
  const email = searchParams.get('email') || '';

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded || !signIn) return;
    
    // Clear previous errors
    setErrors({});
    
    // Validate
    let hasErrors = false;
    
    if (!code) {
      setErrors(prev => ({ ...prev, code: 'Verification code is required' }));
      hasErrors = true;
    }
    
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      hasErrors = true;
    } else {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setErrors(prev => ({ ...prev, password: passwordError }));
        hasErrors = true;
      }
    }
    
    if (!confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Please confirm your password' }));
      hasErrors = true;
    } else if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      hasErrors = true;
    }
    
    if (hasErrors) return;
    
    setLoading(true);
    
    try {
      // Attempt to reset the password
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
        password,
      });

      if (result.status === 'complete' && setActive) {
        // Password reset successful
        setSuccess(true);
        toast.success('Password reset successful! Redirecting to sign in...');
        
        // Sign out to ensure clean state
        await setActive({ session: null });
        
        // Redirect to sign in after a short delay
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
      } else {
        toast.error('Password reset failed. Please try again.');
      }
    } catch (err: any) {
      
      
      if (err.errors) {
        err.errors.forEach((error: any) => {
          if (error.meta?.paramName === 'code' || error.code === 'form_code_incorrect') {
            setErrors(prev => ({ ...prev, code: error.longMessage || 'Invalid verification code' }));
          } else if (error.meta?.paramName === 'password') {
            setErrors(prev => ({ ...prev, password: error.longMessage || 'Invalid password' }));
          } else {
            toast.error(error.longMessage || 'Failed to reset password');
          }
        });
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signIn || !email) return;
    
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      toast.success('New verification code sent! Check your email.');
    } catch (err: any) {
      toast.error('Failed to resend code. Please try again.');
    }
  };

  if (success) {
    return (
      <div className="w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-serif text-[#0A0A0A]">Password Reset Successful!</h1>
          <p className="text-gray-600">
            Your password has been reset successfully. Redirecting to sign in...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      <Link 
        href="/forgot-password" 
        className="inline-flex items-center text-sm text-gray-600 hover:text-[#B5985A] transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      <div className="text-center space-y-2">
        <h1 className="text-4xl font-serif text-[#0A0A0A]">Create New Password</h1>
        <p className="text-gray-600 text-lg">
          Enter the verification code sent to your email
        </p>
        {email && (
          <p className="text-sm text-gray-500">
            Code sent to: <span className="font-medium">{email}</span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <LuxuryInput
          label="Verification code"
          type="text"
          icon={<Mail className="w-5 h-5" />}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={errors.code}
          disabled={loading}
          placeholder="Enter 6-digit code"
        />

        <LuxuryInput
          label="New password"
          type="password"
          icon={<Lock className="w-5 h-5" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          disabled={loading}
        />

        <LuxuryInput
          label="Confirm new password"
          type="password"
          icon={<Lock className="w-5 h-5" />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          disabled={loading}
        />

        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">Password must contain:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>At least 8 characters</li>
            <li>One uppercase letter</li>
            <li>One lowercase letter</li>
            <li>One number</li>
          </ul>
        </div>

        <LuxuryButton
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
        >
          Reset Password
        </LuxuryButton>
      </form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResendCode}
            className="text-[#B5985A] hover:text-[#B5985A]/80 font-medium transition-colors"
            disabled={loading || !email}
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  );
}