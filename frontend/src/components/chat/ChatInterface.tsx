import React, { useEffect, useRef } from 'react'
import { Conversation, Message } from '../../types'
import { ChatHeader } from './ChatHeader'
import { ChatInput } from './ChatInput'
import { ChatMessage } from './ChatMessage'
import { LoadingIndicator } from './LoadingIndicator'
import { Card } from '../ui/Card'

interface ChatInterfaceProps {
  conversation: Conversation | null
  messages: Message[]
  isLoading: boolean
  isStreaming: boolean
  onSendMessage: (content: string) => void
  onUpdateConversation: (updates: Partial<Conversation>) => void
  onDeleteConversation: () => void
  onNewConversation: () => void
  className?: string
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (content: string) => {
    if (!content.trim() || isLoading) {
      return
    }

    onSendMessage(content.trim())
  }

  if (!conversation) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Card className='p-8 text-center max-w-md'>
          <div className='text-6xl mb-4'>💬</div>
          <h2 className='text-xl font-semibold text-gray-900 mb-2'>尚未選擇對話</h2>
          <p className='text-gray-600 mb-4'>請先建立一個 AI 對話，或從左側清單中選擇現有對話。</p>
          <button
            onClick={onNewConversation}
            className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors'
          >
            新建對話
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <ChatHeader
        conversation={conversation}
        onUpdateConversation={onUpdateConversation}
        onDeleteConversation={onDeleteConversation}
        onNewConversation={onNewConversation}
      />

      <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50'>
        {messages.length === 0 ? (
          <div className='flex items-center justify-center h-full text-center text-gray-500'>
            <div>
              <div className='text-4xl mb-2'>🤖</div>
              <p>還沒有任何訊息</p>
              <p className='text-sm mt-1'>
                輸入想詢問的內容，開始與 {conversation.aiProvider} 對話吧！
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <ChatMessage
                key={message.id}
                message={message}
                isStreaming={isStreaming && message.id === 'streaming'}
                onCopy={() => navigator.clipboard.writeText(message.content)}
              />
            ))}

            {isLoading && !isStreaming && <LoadingIndicator />}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className='border-t border-gray-200 bg-white'>
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? 'AI 回應生成中...' : `向 ${conversation.aiProvider} 發送訊息...`}
        />
      </div>
    </div>
  )
}
