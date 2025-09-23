"use client";

import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function SignUpPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Luxury Image */}
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
              Join the Elite
              <span className="block text-gradient">Property Managers</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-md">
              Elevate your property management to unprecedented heights. 
              Experience the gold standard in luxury vacation rental orchestration.
            </p>
            
            <div className="space-y-4 pt-8">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#B5985A]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#B5985A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-300">Unlimited luxury properties</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#B5985A]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#B5985A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-300">24/7 premium support</p>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-[#B5985A]/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#B5985A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-300">Advanced analytics & insights</p>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} ManPhil&Co. All rights reserved.
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-40 left-20 w-40 h-40 bg-[#B5985A]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 right-20 w-32 h-32 bg-[#1c355e]/30 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FAFAF8]">
        <div className="w-full max-w-md space-y-8">
          <div className={`text-center lg:hidden ${mounted ? 'animate-slide-up' : 'opacity-0'}`}>
            <Image 
              src="/Logo Manphil&Co.svg"
              alt="ManPhil&Co Logo"
              width={220}
              height={123}
              className="mx-auto mb-6"
              priority
            />
          </div>

          <div className={`${mounted ? 'animate-slide-up opacity-100' : 'opacity-0'} [animation-delay:200ms]`}>
            <SignUp 
              appearance={{
                baseTheme: undefined,
                elements: {
                  rootBox: "w-full",
                  card: "shadow-2xl shadow-black/10 border-0 bg-white rounded-2xl p-8 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#B5985A]/5 before:to-transparent before:pointer-events-none",
                  headerTitle: "text-3xl font-serif text-[#0A0A0A] mb-2",
                  headerSubtitle: "text-gray-600 text-base font-light",
                  socialButtonsBlockButton: "relative border border-gray-200 hover:border-[#B5985A]/40 bg-white hover:bg-[#B5985A]/5 transition-all duration-300 font-medium py-3 rounded-lg shadow-sm hover:shadow-md",
                  socialButtonsBlockButtonText: "text-gray-700",
                  socialButtonsBlockButtonArrowIcon: "text-gray-400",
                  dividerRow: "my-6 relative",
                  dividerLine: "bg-gradient-to-r from-transparent via-gray-200 to-transparent h-[1px]",
                  dividerText: "text-gray-500 text-xs font-medium tracking-wider uppercase bg-white px-3",
                  formFieldRow: "mb-4",
                  formFieldLabel: "text-sm font-medium text-gray-700 mb-2 block",
                  formFieldInput: "w-full border border-gray-300 focus:border-[#B5985A] focus:ring-2 focus:ring-[#B5985A]/20 rounded-lg px-4 py-3 text-gray-900 placeholder:text-gray-400 transition-all duration-200 bg-white hover:border-gray-400",
                  formFieldInputShowPasswordButton: "text-gray-500 hover:text-[#B5985A] transition-colors",
                  formButtonPrimary: "bg-[#B5985A] hover:bg-[#B5985A]/90 text-white font-medium py-3 px-6 rounded-lg shadow-lg shadow-[#B5985A]/20 hover:shadow-xl hover:shadow-[#B5985A]/25 transition-all duration-300 hover:scale-[1.01] w-full",
                  footerActionLink: "text-[#B5985A] hover:text-[#B5985A]/80 font-medium transition-colors",
                  footerAction: "text-gray-600",
                  identityPreviewEditButtonIcon: "text-[#B5985A]",
                  identityPreviewText: "text-gray-700",
                  formFieldSuccessText: "text-emerald-600 text-sm",
                  formFieldErrorText: "text-rose-600 text-sm",
                  otpCodeFieldInput: "border border-gray-300 focus:border-[#B5985A] focus:ring-2 focus:ring-[#B5985A]/20 rounded-lg text-center font-mono text-lg",
                  formResendCodeLink: "text-[#B5985A] hover:text-[#B5985A]/80 transition-colors text-sm",
                  phoneInputBox: "border border-gray-300 focus-within:border-[#B5985A] focus-within:ring-2 focus-within:ring-[#B5985A]/20 rounded-lg",
                  alternativeMethods: "border-t border-gray-200 pt-6 mt-6",
                  alternativeMethodsBlockButton: "border border-gray-200 hover:border-[#B5985A]/40 bg-white hover:bg-[#B5985A]/5 transition-all duration-300 rounded-lg py-2.5",
                  formFieldAction: "text-[#B5985A] hover:text-[#B5985A]/80 text-sm font-medium transition-colors",
                  headerBackButton: "text-gray-500 hover:text-[#B5985A] transition-colors",
                  headerBackIcon: "w-4 h-4",
                  formFieldHintText: "text-gray-500 text-xs mt-1",
                  verificationLinkStatusIcon: "text-[#B5985A]",
                  verificationLinkStatusText: "text-gray-700",
                  navbarButtons: "text-gray-600 hover:text-[#B5985A] transition-colors",
                  userButtonBox: "border-[#B5985A]/20",
                  userButtonTrigger: "hover:bg-gray-50",
                  badge: "bg-[#B5985A] text-white",
                },
                layout: {
                  socialButtonsPlacement: "top",
                  showOptionalFields: true,
                  termsPageUrl: "#",
                  privacyPageUrl: "#",
                },
                variables: {
                  colorPrimary: "#B5985A",
                  colorText: "#0A0A0A",
                  colorTextSecondary: "#6B7280",
                  colorBackground: "#FFFFFF",
                  colorInputBackground: "#FFFFFF",
                  colorInputText: "#0A0A0A",
                  colorNeutral: "#6B7280",
                  fontFamily: "Inter, system-ui, sans-serif",
                  borderRadius: "0.5rem",
                  spacingUnit: "0.75rem",
                  fontSize: "0.95rem",
                }
              }}
              redirectUrl="/houses"
              signInUrl="/sign-in"
            />
          </div>

          <p className="text-center text-sm text-gray-500 lg:hidden">
            &copy; {new Date().getFullYear()} ManPhil&Co. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}