'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
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
  primary: 'bg-brand-500 text-white hover:bg-brand-600 border-transparent',
  secondary:
    'bg-black/[0.05] text-[color:var(--color-ink)] border border-surface-border hover:bg-black/[0.07]',
  ghost: 'bg-transparent text-[color:var(--color-ink)] border-transparent hover:bg-black/[0.04]',
  danger:
    'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white hover:border-rose-500',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-sm',
  xl: 'px-6 py-3 text-base',
};

export function AppButton({
  variant = 'secondary',
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
        relative inline-flex items-center justify-center gap-2 rounded-button border font-medium transition-colors duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-bg
        active:scale-[0.98]
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${isDisabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={14} />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}

      <span>{children}</span>

      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
