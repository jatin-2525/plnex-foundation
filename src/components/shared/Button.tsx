'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { LucideIcon, Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-[#176B87] hover:bg-[#135A72] active:bg-[#0E4658] text-white border border-[#176B87] shadow-xs disabled:bg-[#8A94A6] disabled:border-[#8A94A6]',
  secondary:
    'bg-white hover:bg-[#F0F2F5] active:bg-[#E8EBF0] text-[#172033] border border-[#D9DEE5] hover:border-[#CBD5E1] shadow-xs disabled:text-[#8A94A6] disabled:border-[#E8EBF0]',
  tertiary:
    'bg-transparent hover:bg-[#F0F2F5] active:bg-[#E8EBF0] text-[#596579] hover:text-[#172033] border border-transparent disabled:text-[#8A94A6]',
  danger:
    'bg-[#FEF2F2] hover:bg-[#FEE2E2] active:bg-[#FECACA] text-[#B91C1C] border border-[#FECACA] hover:border-[#FCA5A5] shadow-xs disabled:text-[#8A94A6]',
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-xs font-medium gap-2',
  lg: 'h-10 px-5 text-sm font-medium gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      isLoading = false,
      disabled,
      className = '',
      type = 'button',
      ...rest
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed select-none ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
        {...rest}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
        ) : (
          Icon && iconPosition === 'left' && <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span>{children}</span>
        {!isLoading && Icon && iconPosition === 'right' && (
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
