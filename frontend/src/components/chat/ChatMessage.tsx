import React, { useMemo, useState } from 'react';
import { Message } from '../../types';
import { Button } from '../ui/Button';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onStop?: () => void;
  className?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  onCopy,
  onRegenerate,
  onStop,
  className = '',
}) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  const formattedTimestamp = useMemo(() => {
    return new Intl.DateTimeFormat('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(message.timestamp));
  }, [message.timestamp]);

  const handleCopy = async () => {
    if (!onCopy) {
      return;
    }

    setCopied(true);
    try {
      await onCopy();
    } finally {
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderContent = () => {
    const content = message.content;

    if (content.includes('```')) {
      const parts = content.split('```');
      return (
        <div className='space-y-2'>
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              const lines = part.split('\n');
              const language = lines[0].trim();
              const code = lines.slice(1).join('\n');

              return (
                <div
                  key={index}
                  className='bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto'
                >
                  {language && <div className='text-xs text-gray-400 mb-2'>{language}</div>}
                  <pre className='text-sm whitespace-pre-wrap'>
                    <code>{code}</code>
                  </pre>
                </div>
              );
            }

            return (
              <div key={index} className='whitespace-pre-wrap'>
                {part}
              </div>
            );
          })}
        </div>
      );
    }

    const inlineCodeRegex = /`([^`]+)`/g;
    if (inlineCodeRegex.test(content)) {
      const segments = content.split(inlineCodeRegex);
      return (
        <div className='whitespace-pre-wrap'>
          {segments.map((segment, index) =>
            index % 2 === 1 ? (
              <code key={index} className='bg-gray-200 text-gray-800 px-1 py-0.5 rounded text-sm'>
                {segment}
              </code>
            ) : (
              segment
            )
          )}
        </div>
      );
    }

    return <div className='whitespace-pre-wrap'>{content}</div>;
  };

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser ? 'bg-blue-500 text-white' : 'bg-white text-gray-900 border border-gray-200'
          } ${isStreaming ? 'animate-pulse' : ''}`}
        >
          <div className='text-sm leading-relaxed'>{renderContent()}</div>

          {isStreaming && (
            <div className='flex items-center mt-2 text-xs text-gray-500'>
              <div className='flex space-x-1'>
                <div className='w-1.5 h-1.5 bg-current rounded-full animate-bounce' />
                <div
                  className='w-1.5 h-1.5 bg-current rounded-full animate-bounce'
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className='w-1.5 h-1.5 bg-current rounded-full animate-bounce'
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
              <span className='ml-2'>正在輸入...</span>
            </div>
          )}

          <div className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {formattedTimestamp}
          </div>
        </div>

        {(showActions || isStreaming) && (
          <div
            className={`flex items-center mt-2 space-x-2 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            {isStreaming && onStop && (
              <Button
                variant='outline'
                size='sm'
                onClick={onStop}
                className='text-red-600 hover:text-red-700 border-red-300 hover:border-red-400'
              >
                停止生成
              </Button>
            )}

            {!isStreaming && (
              <>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleCopy}
                  className='text-gray-500 hover:text-gray-700'
                >
                  {copied ? '已複製' : '複製'}
                </Button>

                {isAssistant && onRegenerate && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onRegenerate}
                    className='text-gray-500 hover:text-gray-700'
                  >
                    重新生成
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className={`flex-shrink-0 ${isUser ? 'order-1 mr-3' : 'order-2 ml-3'}`}>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          {isUser ? '👤' : '🤖'}
        </div>
      </div>
    </div>
  );
};
