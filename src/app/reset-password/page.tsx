"use client";

import Image from "next/image";
import { useEffect, useState, Suspense } from "react";
import CustomResetPassword from "@/components/auth/custom-reset-password";

function ResetPasswordContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0A0A0A]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#B5985A]/30 via-[#0A0A0A]/50 to-[#1c355e]/80"></div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <Image 
              src="/Logo Manphil&Co.svg"
              alt="ManPhil&Co Logo"
              width={200}
              height={112}
              className="brightness-0 invert mb-8"
              priority
            />
          </div>
          
          <div className={`space-y-6 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <h1 className="text-5xl font-serif font-light leading-tight">
              Almost There
              <span className="block text-gradient">New Beginning</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-md">
              Create a strong password to secure your account. 
              Your journey continues with enhanced protection.
            </p>
            
            <div className="space-y-4 pt-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#B5985A]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#B5985A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <p className="text-gray-300">Strong password protection</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#B5985A]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#B5985A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-2 4h4" />
                  </svg>
                </div>
                <p className="text-gray-300">Multi-factor authentication</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#B5985A]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#B5985A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-gray-300">Instant access restoration</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ManPhil&Co. All rights reserved.
          </div>
        </div>

        <div className="absolute top-40 right-20 w-32 h-32 bg-[#1c355e]/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-[#B5985A]/20 rounded-full blur-3xl"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="w-full max-w-md">
          <div className={`lg:hidden text-center mb-8 ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
            <Image 
              src="/Logo Manphil&Co.svg"
              alt="ManPhil&Co Logo"
              width={220}
              height={123}
              className="mx-auto"
              priority
            />
          </div>

          <div className={`${mounted ? 'animate-slide-up opacity-100' : 'opacity-0'} [animation-delay:200ms]`}>
            <CustomResetPassword />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B5985A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}