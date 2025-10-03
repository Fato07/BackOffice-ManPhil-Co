"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import CustomSignIn from "@/components/auth/custom-sign-in";

export default function SignInPage() {
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
              Welcome to
              <span className="block text-gradient">Luxury Management</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-md">
              Experience the pinnacle of property management excellence. 
              Your journey to sophisticated portfolio orchestration begins here.
            </p>
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
            <CustomSignIn />
          </div>
        </div>
      </div>
    </div>
  );
}