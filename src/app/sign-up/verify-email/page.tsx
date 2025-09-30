"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail } from "lucide-react";
import LuxuryButton from "@/components/auth/luxury-button";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    const newCode = [...code];
    
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    
    setCode(newCode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoaded) return;
    
    const completeCode = code.join("");
    
    if (completeCode.length !== 6) {
      toast.error("Please enter a complete verification code");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: completeCode,
      });

      if (result.status === "complete" && setActive) {
        await setActive({ session: result.createdSessionId });
        router.push("/houses");
      } else {
        toast.error("Verification failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      toast.error(err.errors?.[0]?.longMessage || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!isLoaded || !signUp) return;
    
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      toast.success("Verification code sent! Check your email.");
    } catch (err: any) {
      toast.error("Failed to resend code. Please try again.");
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
          
          <div className="w-16 h-16 bg-[#B5985A]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-[#B5985A]" />
          </div>
          
          <h1 className="text-3xl font-serif text-[#0A0A0A] mb-2">Verify your email</h1>
          <p className="text-gray-600">
            We've sent a verification code to your email address. 
            Please enter it below to complete your registration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-3 justify-center">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-12 h-12 text-center text-lg font-mono border-2 border-gray-200 rounded-lg focus:border-[#B5985A] focus:ring-2 focus:ring-[#B5985A]/20 focus:outline-none transition-all"
                disabled={loading}
              />
            ))}
          </div>

          <LuxuryButton
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
          >
            Verify Email
          </LuxuryButton>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResendCode}
                className="text-[#B5985A] hover:text-[#B5985A]/80 font-medium transition-colors"
                disabled={loading}
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