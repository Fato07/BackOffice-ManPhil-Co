"use client";

import React, { useState } from 'react';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Mail, Lock } from 'lucide-react';
import LuxuryInput from './luxury-input';
import LuxuryButton from './luxury-button';
import SocialLoginButton from './social-login-button';
import Link from 'next/link';
import { toast } from 'sonner';

export default function CustomSignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    
    // Clear previous errors
    setErrors({});
    
    // Validate
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete' && setActive) {
        await setActive({ session: result.createdSessionId });
        router.push('/houses');
      } else if (result.status !== 'complete') {
        // Handle other statuses
        console.error('Sign in not complete:', result);
        toast.error('Sign in process incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      if (err.errors) {
        const emailError = err.errors.find((e: any) => e.meta?.paramName === 'identifier');
        const passwordError = err.errors.find((e: any) => e.meta?.paramName === 'password');
        
        if (emailError) {
          setErrors(prev => ({ ...prev, email: emailError.longMessage || 'Invalid email' }));
        }
        if (passwordError) {
          setErrors(prev => ({ ...prev, password: passwordError.longMessage || 'Invalid password' }));
        }
        if (!emailError && !passwordError && err.errors[0]) {
          toast.error(err.errors[0].longMessage || 'Invalid email or password');
        }
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'oauth_google') => {
    if (!isLoaded || !signIn) return;
    
    setSocialLoading(provider);
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/houses',
        redirectUrlComplete: '/houses',
      });
    } catch (err) {
      console.error('Social login error:', err);
      toast.error('Failed to connect with Google. Please try again.');
      setSocialLoading(null);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-serif text-[#0A0A0A]">Welcome Back</h1>
        <p className="text-gray-600 text-lg">Sign in to access your properties</p>
      </div>

      {/* Social Login */}
      <div className="space-y-3">
        <SocialLoginButton
          provider="google"
          onClick={() => handleSocialLogin('oauth_google')}
          loading={socialLoading === 'oauth_google'}
        />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-[#FAFAF8] text-gray-500">or continue with email</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
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
          autoComplete="current-password"
          disabled={loading}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="w-4 h-4 text-[#B5985A] border-gray-300 rounded focus:ring-[#B5985A] focus:ring-2"
            />
            <span className="ml-2 text-sm text-gray-600">Remember me</span>
          </label>
          
          <Link 
            href="#" 
            className="text-sm text-[#B5985A] hover:text-[#B5985A]/80 font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <LuxuryButton
          type="submit"
          className="w-full"
          size="lg"
          loading={loading}
        >
          Sign In
        </LuxuryButton>
      </form>

      {/* Footer */}
      <p className="text-center text-gray-600">
        Don't have an account?{' '}
        <Link href="/sign-up" className="text-[#B5985A] hover:text-[#B5985A]/80 font-medium transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}