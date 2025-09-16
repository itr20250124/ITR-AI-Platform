import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // 處理ESC鍵關閉
  useEffect(() => {
    if (!closeOnEscape) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // 處理body滾動鎖定
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // 處理點擊遮罩關閉
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      {/* 遮罩 */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
        onClick={handleOverlayClick}
      />

      {/* Modal容器 */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div
          ref={modalRef}
          className={`
            relative w-full ${sizeClasses[size]}
            bg-white dark:bg-gray-800
            rounded-lg shadow-xl
            transform transition-all
            animate-slide-up
          `}
        >
          {/* Header */}
          {title && (
            <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>{title}</h3>
              <Button variant='ghost' size='sm' onClick={onClose} className='p-2'>
                <X className='w-4 h-4' />
              </Button>
            </div>
          )}

          {/* Content */}
          <div className={title ? 'p-6' : 'p-6'}>{children}</div>
        </div>
      </div>
    </div>
  )
}

// Modal子組件
interface ModalHeaderProps {
  children: React.ReactNode
  onClose?: () => void
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, onClose }) => {
  return (
    <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
      <div className='text-lg font-semibold text-gray-900 dark:text-gray-100'>{children}</div>
      {onClose && (
        <Button variant='ghost' size='sm' onClick={onClose} className='p-2'>
          <X className='w-4 h-4' />
        </Button>
      )}
    </div>
  )
}

interface ModalContentProps {
  children: React.ReactNode
}

export const ModalContent: React.FC<ModalContentProps> = ({ children }) => {
  return <div className='p-6'>{children}</div>
}

interface ModalFooterProps {
  children: React.ReactNode
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children }) => {
  return (
    <div className='flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700'>
      {children}
    </div>
  )
}
