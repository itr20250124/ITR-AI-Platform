import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = '', 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    fullWidth = false,
    disabled,
    children,
    ...props 
  }, ref) => {
    const baseClasses = `
      inline-flex items-center justify-center
      font-medium rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      dark:focus:ring-offset-gray-900
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantClasses = {
      primary: `
        bg-primary-600 hover:bg-primary-700 
        text-white 
        focus:ring-primary-500
        disabled:hover:bg-primary-600
      `,
      secondary: `
        bg-gray-200 hover:bg-gray-300 
        dark:bg-gray-700 dark:hover:bg-gray-600
        text-gray-900 dark:text-gray-100
        focus:ring-gray-500
      `,
      outline: `
        border border-gray-300 dark:border-gray-600
        bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800
        text-gray-700 dark:text-gray-300
        focus:ring-gray-500
      `,
      ghost: `
        bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800
        text-gray-700 dark:text-gray-300
        focus:ring-gray-500
      `,
      danger: `
        bg-red-600 hover:bg-red-700
        text-white
        focus:ring-red-500
        disabled:hover:bg-red-600
      `,
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <button
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${widthClass}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';