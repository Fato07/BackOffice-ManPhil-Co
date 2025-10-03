"use client";

import React, { useState, forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface LuxuryInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'tel';
  icon?: React.ReactNode;
}

const LuxuryInput = forwardRef<HTMLInputElement, LuxuryInputProps>(
  ({ label, error, type = 'text', icon, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    const inputType = type === 'password' && showPassword ? 'text' : type;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.length > 0);
      if (props.onChange) props.onChange(e);
    };

    return (
      <div className="relative w-full group">
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full px-4 py-4 bg-white border-2 border-gray-200 rounded-xl",
              "text-gray-900 font-medium placeholder-transparent",
              "transition-all duration-300 ease-out",
              "hover:border-gray-300",
              "focus:outline-none focus:border-[#B5985A] focus:ring-4 focus:ring-[#B5985A]/10",
              "peer",
              icon && "pl-12",
              type === 'password' && "pr-12",
              error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
              className
            )}
            placeholder={label}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={handleChange}
            {...props}
          />

          <label
            className={cn(
              "absolute left-4 transition-all duration-300 pointer-events-none",
              "text-gray-500 font-medium",
              icon && "left-12",
              (focused || hasValue || props.value || props.defaultValue) ? [
                "-top-2.5 text-xs px-2 bg-white",
                focused && !error && "text-[#B5985A]",
                error && "text-rose-500"
              ] : [
                "top-4 text-base"
              ]
            )}
          >
            {label}
          </label>

          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#B5985A] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}

          <div 
            className={cn(
              "absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none",
              "bg-gradient-to-r from-[#B5985A]/10 via-[#B5985A]/5 to-transparent",
              focused ? "opacity-100" : "opacity-0"
            )}
          />
        </div>

        {error && (
          <p className="mt-1.5 text-sm text-rose-600 font-medium animate-slide-up">
            {error}
          </p>
        )}
      </div>
    );
  }
);

LuxuryInput.displayName = 'LuxuryInput';

export default LuxuryInput;