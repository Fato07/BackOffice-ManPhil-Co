"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import CustomForgotPassword from "@/components/auth/custom-forgot-password";

export default function ForgotPasswordPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0A0A0A]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1c355e]/80 via-[#0A0A0A]/50 to-[#B5985A]/30"></div>
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
              Security First
              <span className="block text-gradient">Always Protected</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-md">
              Your security is our priority. Reset your password with confidence 
              through our secure verification process.
            </p>
            
            <div className="space-y-4 pt-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#B5985A]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#B5985A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-gray-300">256-bit encryption</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#B5985A]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#B5985A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-gray-300">Secure verification process</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#B5985A]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#B5985A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-300">Quick recovery process</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ManPhil&Co. All rights reserved.
          </div>
        </div>

        <div className="absolute top-20 right-20 w-32 h-32 bg-[#B5985A]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-[#1c355e]/30 rounded-full blur-3xl"></div>
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
            <CustomForgotPassword />
          </div>
        </div>
      </div>
    </div>
  );
}