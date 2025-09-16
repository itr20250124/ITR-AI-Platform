import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = '輸入訊息...',
  maxLength = 10000,
  className = '',
}) => {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) {
      return;
    }

    onSendMessage(trimmed);
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData('text');
    const next = message + pasted;

    if (next.length > maxLength) {
      event.preventDefault();
      const remaining = maxLength - message.length;
      if (remaining > 0) {
        setMessage(message + pasted.slice(0, remaining));
      }
    }
  };

  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-end space-x-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`
              w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg resize-none
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${disabled ? 'opacity-50' : ''}
            `}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />

          {isNearLimit && (
            <div
              className={`absolute bottom-1 right-12 text-xs ${
                characterCount >= maxLength ? 'text-red-500' : 'text-yellow-500'
              }`}
            >
              {characterCount}/{maxLength}
            </div>
          )}
        </div>

        <Button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            px-4 py-3 min-w-[80px] transition-all duration-200
            ${canSend ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
          `}
        >
          {disabled ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>傳送中</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>傳送</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          )}
        </Button>
      </div>

      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>按 Enter 傳送，Shift + Enter 換行</span>
        {!isNearLimit && <span>{characterCount} 字符</span>}
      </div>
    </div>
  );
};
