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
    'bg-[#006B61] hover:bg-[#00524A] active:bg-[#003D37] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] dark:active:bg-[#47A287] text-white dark:text-[#0B2822] border border-[#006B61] dark:border-[#72C6AD] shadow-xs disabled:opacity-50 font-semibold',
  secondary:
    'bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] active:bg-[#D9E2DA] dark:active:bg-[#2D443D] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] shadow-xs disabled:opacity-50',
  tertiary:
    'bg-transparent hover:bg-[#EAF0E9] dark:hover:bg-[#243832] active:bg-[#D9E2DA] dark:active:bg-[#2D443D] text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] border border-transparent disabled:opacity-50',
  danger:
    'bg-[#F6E4E1] dark:bg-[#3B2422] hover:bg-[#F0CECA] dark:hover:bg-[#4D2C2A] text-[#A43B36] dark:text-[#FF9E94] border border-[#DCABA7] dark:border-[#5B3734] shadow-xs disabled:opacity-50',
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-xs font-semibold gap-2',
  lg: 'h-10 px-4 text-sm font-semibold gap-2',
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
