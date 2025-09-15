import React, { useState, useRef, useEffect } from 'react';
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

  // 自動調整文本框高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // 處理發送訊息
  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      // 重置文本框高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // 處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  // 處理輸入法組合事件
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // 處理文本變化
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  // 處理粘貼事件
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    const newText = message + pastedText;
    
    if (newText.length > maxLength) {
      e.preventDefault();
      const remainingLength = maxLength - message.length;
      if (remainingLength > 0) {
        setMessage(message + pastedText.substring(0, remainingLength));
      }
    }
  };

  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const canSend = message.trim().length > 0 && !disabled;

  return (
    <div className={`p-4 ${className}`}>
      <div className="flex items-end space-x-3">
        {/* 文本輸入區域 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
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
          
          {/* 字符計數 */}
          {isNearLimit && (
            <div className={`absolute bottom-1 right-12 text-xs ${
              characterCount >= maxLength ? 'text-red-500' : 'text-yellow-500'
            }`}>
              {characterCount}/{maxLength}
            </div>
          )}
        </div>

        {/* 發送按鈕 */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            px-4 py-3 min-w-[80px] transition-all duration-200
            ${canSend 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {disabled ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span>發送中</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span>發送</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          )}
        </Button>
      </div>

      {/* 提示文字 */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>按 Enter 發送，Shift + Enter 換行</span>
        {!isNearLimit && (
          <span>{characterCount} 字符</span>
        )}
      </div>
    </div>
  );
};