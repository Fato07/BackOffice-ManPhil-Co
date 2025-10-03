"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import LuxuryButton from "@/components/auth/luxury-button";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type VerificationState = 'idle' | 'verifying' | 'success' | 'error';

// Color constants
const BRAND_COLOR = '#B5985A';
const TEXT_DARK = '#0A0A0A';

// Type definitions for Clerk errors
interface ClerkError {
  code?: string;
  longMessage?: string;
  meta?: {
    paramName?: string;
  };
}

interface ClerkErrorResponse {
  errors?: ClerkError[];
  message?: string;
}

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const [verificationState, setVerificationState] = useState<VerificationState>('idle');
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  // Helper functions
  const isLoading = verificationState === 'verifying';
  const isDisabled = isLoading || verificationState === 'success';
  
  const getButtonText = () => {
    switch (verificationState) {
      case 'verifying': return 'Verifying...';
      case 'success': return 'Verified Successfully!';
      default: return 'Verify Email';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    
    if (code.length !== 6) {
      toast.error("Please enter a complete verification code");
      setVerificationState('error');
      return;
    }
    
    setVerificationState('verifying');
    
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete" && setActive) {
        setVerificationState('success');
        await setActive({ session: result.createdSessionId });
        router.push("/houses");
      } else {
        setVerificationState('error');
        toast.error("Verification failed. Please try again.");
      }
    } catch (err: unknown) {
      
      setVerificationState('error');
      
      // Handle Clerk error structure  
      const clerkError = err as ClerkErrorResponse;
      toast.error(clerkError?.errors?.[0]?.longMessage || "Invalid verification code");
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;
    
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      toast.success("Verification code sent! Check your email.");
    } catch (err: unknown) {
      
      toast.error("Failed to resend code. Please try again.");
    }
  };

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (verificationState === 'error') {
      setVerificationState('idle');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Image 
            src="/Logo Manphil&Co.svg"
            alt="ManPhil&Co Logo"
            width={220}
            height={123}
            className="mx-auto mb-8"
            priority
          />
          
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${BRAND_COLOR}1A` }}>
            <Mail className="w-8 h-8" style={{ color: BRAND_COLOR }} />
          </div>
          
          <h1 className="text-3xl font-serif mb-2" style={{ color: TEXT_DARK }}>Verify your email</h1>
          <p className="text-gray-600">
            We&apos;ve sent a verification code to your email address. 
            Please enter it below to complete your registration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <div className={`flex justify-center transition-all duration-300 ${
              isLoading ? 'blur-sm opacity-50' : ''
            }`}>
              <InputOTP
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                disabled={isDisabled}
                containerClassName="gap-3"
              >
                <InputOTPGroup className="gap-3">
                  {Array.from({ length: 6 }, (_, index) => {
                    const getSlotStyles = () => {
                      const baseStyles = "w-12 h-12 text-xl font-semibold bg-white rounded-md shadow-sm cursor-pointer transition-all duration-300";
                      
                      if (verificationState === 'success') {
                        return `${baseStyles} border-green-500 text-green-600 bg-green-50`;
                      }
                      
                      if (verificationState === 'error') {
                        return `${baseStyles} border-red-500 text-red-600 bg-red-50 animate-pulse`;
                      }
                      
                      return `${baseStyles} border border-gray-300 hover:opacity-80 data-[active=true]:ring-2`;
                    };

                    return (
                      <InputOTPSlot 
                        key={index}
                        index={index} 
                        className={getSlotStyles()}
                        style={{
                          '--brand-color': BRAND_COLOR,
                          color: TEXT_DARK
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </InputOTPGroup>
              </InputOTP>
            </div>

            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin mb-2" style={{ color: BRAND_COLOR }} />
                <p className="text-sm text-gray-600 font-medium">Verifying your code...</p>
              </div>
            )}

            {verificationState === 'success' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-50/90 backdrop-blur-sm rounded-lg animate-fade-in">
                <CheckCircle2 className="w-8 h-8 text-green-600 mb-2 animate-check-bounce" />
                <p className="text-sm text-green-700 font-medium">Email verified! Redirecting...</p>
              </div>
            )}
          </div>

          <LuxuryButton
            type="submit"
            className="w-full"
            size="lg"
            loading={isLoading}
            disabled={isDisabled}
          >
            {getButtonText()}
          </LuxuryButton>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResendCode}
                className="font-medium transition-colors"
                style={{ 
                  color: BRAND_COLOR,
                  opacity: isLoading ? 0.5 : 1
                }}
                disabled={isLoading}
              >
                Resend
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}