"use client";

import React, { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User } from 'lucide-react';
import LuxuryInput from './luxury-input';
import LuxuryButton from './luxury-button';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CustomSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ 
    firstName?: string; 
    lastName?: string; 
    email?: string; 
    password?: string;
    confirmPassword?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    
    // Clear previous errors
    setErrors({});
    
    // Validate
    let hasErrors = false;
    
    if (!firstName) {
      setErrors(prev => ({ ...prev, firstName: 'First name is required' }));
      hasErrors = true;
    }
    
    if (!lastName) {
      setErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
      hasErrors = true;
    }
    
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      hasErrors = true;
    }
    
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      hasErrors = true;
    } else if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }));
      hasErrors = true;
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
      await signUp.create({
        firstName,
        lastName,
        emailAddress: email,
        password,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      // Navigate to verification page
      router.push('/sign-up/verify-email');
    } catch (err: any) {
      console.error('Sign up error:', err);
      
      if (err.errors) {
        err.errors.forEach((error: any) => {
          if (error.meta?.paramName === 'email_address') {
            setErrors(prev => ({ ...prev, email: error.longMessage || 'Invalid email' }));
          } else if (error.meta?.paramName === 'password') {
            setErrors(prev => ({ ...prev, password: error.longMessage || 'Invalid password' }));
          } else if (error.meta?.paramName === 'first_name') {
            setErrors(prev => ({ ...prev, firstName: error.longMessage || 'Invalid first name' }));
          } else if (error.meta?.paramName === 'last_name') {
            setErrors(prev => ({ ...prev, lastName: error.longMessage || 'Invalid last name' }));
          } else {
            toast.error(error.longMessage || 'An error occurred during sign up');
          }
        });
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-serif text-[#0A0A0A]">Create Your Account</h1>
        <p className="text-gray-600 text-lg">Join ManPhil&Co's elite property management platform</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <LuxuryInput
            label="First name"
            type="text"
            icon={<User className="w-5 h-5" />}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            autoComplete="given-name"
            disabled={loading}
          />

          <LuxuryInput
            label="Last name"
            type="text"
            icon={<User className="w-5 h-5" />}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            autoComplete="family-name"
            disabled={loading}
          />
        </div>

        <LuxuryInput
          label="Email address"
          type="email"
          icon={<Mail className="w-5 h-5" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          disabled={loading}
        />

        <LuxuryInput
          label="Password"
          type="password"
          icon={<Lock className="w-5 h-5" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          disabled={loading}
        />

        <LuxuryInput
          label="Confirm password"
          type="password"
          icon={<Lock className="w-5 h-5" />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          disabled={loading}
        />

        <div className="space-y-4">
          <label className="flex items-start">
            <input
              type="checkbox"
              className="w-4 h-4 mt-1 text-[#B5985A] border-gray-300 rounded focus:ring-[#B5985A] focus:ring-2"
              required
            />
            <span className="ml-2 text-sm text-gray-600">
              I agree to the{' '}
              <Link href="#" className="text-[#B5985A] hover:text-[#B5985A]/80 transition-colors">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" className="text-[#B5985A] hover:text-[#B5985A]/80 transition-colors">
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        <LuxuryButton
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
        >
          Create Account
        </LuxuryButton>
      </form>

      {/* Footer */}
      <p className="text-center text-gray-600">
        Already have an account?{' '}
        <Link href="/sign-in" className="text-[#B5985A] hover:text-[#B5985A]/80 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}