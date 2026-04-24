'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'technical' | 'ghost' | 'danger' | 'white';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-slate-950 hover:bg-brand-400 shadow-glow-brand/20 border-brand-500',
  technical:
    'bg-white/[0.03] text-brand-400 border-white/10 hover:bg-white/[0.08] hover:border-brand-500/30 hover:text-brand-300',
  ghost: 'bg-transparent text-white/40 border-transparent hover:bg-white/5 hover:text-white',
  danger:
    'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white hover:border-rose-500',
  white: 'bg-white text-slate-950 hover:bg-brand-50 border-white shadow-luxe',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[9px]',
  md: 'px-5 py-2.5 text-[10px]',
  lg: 'px-8 py-3.5 text-[11px]',
  xl: 'px-10 py-4.5 text-[12px]',
};

export function AppButton({
  variant = 'technical',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      disabled={isDisabled}
      className={`
        relative group overflow-hidden rounded-sm font-black uppercase tracking-[0.2em] transition-all duration-300 border flex items-center justify-center gap-3 active:scale-95
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500 pointer-events-none" />

      {isLoading ? (
        <Loader2 className="animate-spin" size={14} />
      ) : (
        leftIcon && (
          <span className="relative z-10 transition-transform group-hover:scale-110">
            {leftIcon}
          </span>
        )
      )}

      <span className="relative z-10">{children}</span>

      {!isLoading && rightIcon && (
        <span className="relative z-10 transition-transform group-hover:translate-x-0.5">
          {rightIcon}
        </span>
      )}
    </button>
  );
}
