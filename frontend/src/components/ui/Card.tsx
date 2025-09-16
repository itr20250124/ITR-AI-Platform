import React, { HTMLAttributes, forwardRef } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseClasses = `
      bg-white dark:bg-gray-800
      rounded-lg
      transition-colors duration-200
    `

    const variantClasses = {
      default: `
        border border-gray-200 dark:border-gray-700
      `,
      outlined: `
        border-2 border-gray-300 dark:border-gray-600
      `,
      elevated: `
        shadow-md hover:shadow-lg
        border border-gray-200 dark:border-gray-700
        transition-shadow duration-200
      `,
    }

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${paddingClasses[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card子組件
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', title, subtitle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          border-b border-gray-200 dark:border-gray-700
          pb-4 mb-4
          ${className}
        `}
        {...props}
      >
        {title && (
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>{title}</h3>
        )}
        {subtitle && <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>{subtitle}</p>}
        {children}
      </div>
    )
  }
)

CardHeader.displayName = 'CardHeader'

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div ref={ref} className={`${className}`} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          border-t border-gray-200 dark:border-gray-700
          pt-4 mt-4
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    )
  }
)

CardFooter.displayName = 'CardFooter'
