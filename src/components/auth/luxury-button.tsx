"use client";

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LuxuryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const LuxuryButton = forwardRef<HTMLButtonElement, LuxuryButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    className, 
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-xl overflow-hidden group";
    
    const variants = {
      primary: [
        "bg-gradient-to-r from-[#B5985A] to-[#C5A86A] text-white",
        "hover:from-[#A58754] hover:to-[#B5985A]",
        "shadow-lg shadow-[#B5985A]/25 hover:shadow-xl hover:shadow-[#B5985A]/30",
        "hover:scale-[1.02] active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      ],
      secondary: [
        "bg-white text-[#B5985A] border-2 border-[#B5985A]",
        "hover:bg-[#B5985A] hover:text-white",
        "shadow-md hover:shadow-lg",
        "hover:scale-[1.01] active:scale-[0.99]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      ],
      ghost: [
        "bg-transparent text-gray-700 border border-gray-200",
        "hover:bg-gray-50 hover:border-[#B5985A]/40 hover:text-[#B5985A]",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      ]
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg"
    };

    const renderIcon = () => {
      if (loading) {
        return <Loader2 className="w-4 h-4 animate-spin" />;
      }
      return icon;
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        <span 
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            "bg-gradient-to-r from-transparent via-white/20 to-transparent",
            "opacity-0 group-hover:opacity-100",
            "-translate-x-full group-hover:translate-x-full",
            "transition-transform duration-700"
          )}
        />

        <span className="relative flex items-center gap-2">
          {iconPosition === 'left' && renderIcon()}
          {children}
          {iconPosition === 'right' && renderIcon()}
        </span>

        <span 
          className={cn(
            "absolute inset-0 rounded-xl",
            variant === 'primary' && "bg-white/20",
            variant === 'secondary' && "bg-[#B5985A]/20",
            variant === 'ghost' && "bg-gray-900/10"
          )}
          style={{
            background: `radial-gradient(circle, currentColor 10%, transparent 10.01%)`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '50%',
            transform: 'scale(10, 10)',
            opacity: 0,
            transition: 'transform .5s, opacity 1s',
          }}
        />
      </button>
    );
  }
);

LuxuryButton.displayName = 'LuxuryButton';

export default LuxuryButton;