import React, { useState, useRef, useEffect } from 'react';
import { Message, Conversation } from '../../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { LoadingIndicator } from './LoadingIndicator';
import { Card } from '../ui/Card';

interface ChatInterfaceProps {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onUpdateConversation: (updates: Partial<Conversation>) => void;
  onDeleteConversation: () => void;
  onNewConversation: () => void;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  messages,
  isLoading,
  isStreaming,
  onSendMessage,
  onUpdateConversation,
  onDeleteConversation,
  onNewConversation,
  className = '',
}) => {
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // 處理串流訊息更新
  const handleStreamingUpdate = (chunk: string) => {
    setStreamingMessage(prev => prev + chunk);
  };

  // 重置串流訊息
  const resetStreamingMessage = () => {
    setStreamingMessage('');
  };

  // 處理發送訊息
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    resetStreamingMessage();
    onSendMessage(content);
  };

  // 處理重新生成回應
  const handleRegenerateResponse = () => {
    if (messages.length === 0) return;
    
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      onSendMessage(lastUserMessage.content);
    }
  };

  // 處理停止生成
  const handleStopGeneration = () => {
    // 這裡應該調用停止生成的API
    resetStreamingMessage();
  };

  if (!conversation) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Card className="p-8 text-center max-w-md">
          <div className="text-6xl mb-4">💬</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            開始新對話
          </h2>
          <p className="text-gray-600 mb-4">
            選擇一個AI模型開始對話，或從左側選擇現有對話
          </p>
          <button
            onClick={onNewConversation}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            新建對話
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 聊天標題欄 */}
      <ChatHeader
        conversation={conversation}
        onUpdateConversation={onUpdateConversation}
        onDeleteConversation={onDeleteConversation}
        onNewConversation={onNewConversation}
      />

      {/* 訊息區域 */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">🤖</div>
              <p>開始與 {conversation.aiProvider} 對話吧！</p>
              <p className="text-sm mt-1">輸入您的問題或想法</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onCopy={() => navigator.clipboard.writeText(message.content)}
                onRegenerate={message.role === 'assistant' ? handleRegenerateResponse : undefined}
              />
            ))}
            
            {/* 串流中的訊息 */}
            {isStreaming && streamingMessage && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  conversationId: conversation.id,
                  role: 'assistant',
                  content: streamingMessage,
                  timestamp: new Date(),
                }}
                isStreaming={true}
                onStop={handleStopGeneration}
              />
            )}
            
            {/* 載入指示器 */}
            {isLoading && !isStreaming && (
              <LoadingIndicator />
            )}
          </>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 輸入區域 */}
      <div className="border-t border-gray-200 bg-white">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={
            isLoading 
              ? '正在生成回應...' 
              : `向 ${conversation.aiProvider} 發送訊息...`
          }
        />
      </div>
    </div>
  );
};