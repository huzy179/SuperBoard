'use client';

import React from 'react';
import { QuantumButton } from '@superboard/ui';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

type QuantumButtonBaseProps = React.ComponentProps<typeof QuantumButton>;

interface AppButtonProps extends Omit<
  QuantumButtonBaseProps,
  'variant' | 'size' | 'loading' | 'children'
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

function mapSize(size: ButtonSize): 'sm' | 'md' | 'lg' {
  if (size === 'sm') return 'sm';
  if (size === 'md') return 'md';
  return 'lg';
}

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
    <QuantumButton
      {...props}
      disabled={isDisabled}
      variant={variant}
      size={mapSize(size)}
      loading={isLoading}
      className={`${isDisabled ? 'grayscale' : ''} ${className}`}
    >
      {leftIcon ? (
        <span className="shrink-0 inline-flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-current">
          {leftIcon}
        </span>
      ) : null}
      {children}
      {rightIcon ? (
        <span className="shrink-0 inline-flex items-center justify-center [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-current">
          {rightIcon}
        </span>
      ) : null}
    </QuantumButton>
  );
}
