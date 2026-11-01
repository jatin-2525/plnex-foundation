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
    'bg-[#0F6B68] hover:bg-[#135A72] active:bg-[#0F4A5E] text-white border border-[#0F6B68] shadow-xs disabled:bg-[#7B8798] disabled:border-[#7B8798]',
  secondary:
    'bg-white hover:bg-[#EAF0F5] active:bg-[#D8E2EA] text-[#142C3F] border border-[#D8E2EA] hover:border-[#CBD5E1] shadow-xs disabled:text-[#7B8798] disabled:border-[#D8E2EA]',
  tertiary:
    'bg-transparent hover:bg-[#EAF0F5] active:bg-[#D8E2EA] text-[#526779] hover:text-[#142C3F] border border-transparent disabled:text-[#7B8798]',
  danger:
    'bg-[#FCE8E4] hover:bg-[#F8E3E1] active:bg-[#F4D0CC] text-[#A24335] border border-[#E4B0AA] shadow-xs disabled:text-[#7B8798]',
};

export const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-2',
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
        className={`inline-flex items-center justify-center font-medium rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed select-none ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
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
