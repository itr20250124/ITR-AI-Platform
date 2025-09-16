import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { ChatInterface } from '../components/chat/ChatInterface'
import { ConversationSidebar } from '../components/chat/ConversationSidebar'
import { Button } from '../components/ui/Button'
import { useChat } from '../hooks/useChat'
import { useConversations } from '../hooks/useConversations'

const DEFAULT_PARAMETERS: Record<string, Record<string, unknown>> = {
  openai: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000,
  },
  gemini: {
    model: 'gemini-pro',
    temperature: 0.7,
  },
}

const getDefaultParameters = (provider: string): Record<string, unknown> => {
  return DEFAULT_PARAMETERS[provider] ?? DEFAULT_PARAMETERS.openai
}

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState('openai')

  const chat = useChat({
    conversationId,
    enableStreaming: true,
  })

  const conversations = useConversations({ autoLoad: true })

  useEffect(() => {
    if (chat.conversation?.aiProvider) {
      setSelectedProvider(chat.conversation.aiProvider)
    }
  }, [chat.conversation?.aiProvider])

  const handleNewConversation = async () => {
    try {
      const title = chat.conversation ? `新對話 ${new Date().toLocaleTimeString()}` : '新的對話'

      const newConversation = await conversations.createConversation(
        title,
        selectedProvider,
        getDefaultParameters(selectedProvider)
      )

      navigate(`/chat/${newConversation.id}`)
    } catch (error) {
      console.error('建立對話失敗:', error)
      toast.error('建立對話失敗')
    }
  }

  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`)
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) {
      return
    }

    if (!chat.conversation) {
      try {
        const title = content.length > 30 ? `${content.slice(0, 30)}...` : content
        const newConversation = await conversations.createConversation(
          title || '新的對話',
          selectedProvider,
          getDefaultParameters(selectedProvider)
        )

        navigate(`/chat/${newConversation.id}`)

        setTimeout(() => {
          chat.sendMessage(content)
        }, 100)
      } catch (error) {
        toast.error('建立對話失敗')
      }

      return
    }

    await chat.sendMessage(content)
  }

  const handleUpdateConversation = async (updates: Partial<any>) => {
    if (!chat.conversation) {
      return
    }

    await chat.updateConversation(updates)
    await conversations.updateConversation(chat.conversation.id, updates)

    if (updates.aiProvider) {
      setSelectedProvider(updates.aiProvider)
    }
  }

  const handleDeleteConversation = async () => {
    if (!chat.conversation) {
      return
    }

    await chat.deleteConversation()
    await conversations.deleteConversation(chat.conversation.id)
    navigate('/chat')
  }

  const handleExportConversation = async () => {
    try {
      const exportText = await chat.exportConversation()
      const blob = new Blob([exportText], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${chat.conversation?.title ?? '對話'}.md`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('導出對話失敗:', error)
      toast.error('導出對話失敗')
    }
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        handleNewConversation()
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  const messages = useMemo(() => {
    if (!chat.conversation) {
      return chat.messages
    }

    if (!chat.streamingMessage) {
      return chat.messages
    }

    return [
      ...chat.messages,
      {
        id: 'streaming',
        conversationId: chat.conversation.id,
        role: 'assistant' as const,
        content: chat.streamingMessage,
        timestamp: new Date(),
      },
    ]
  }, [chat.conversation, chat.messages, chat.streamingMessage])

  return (
    <div className='flex h-screen bg-gray-100'>
      <ConversationSidebar
        conversations={conversations.conversations}
        currentConversationId={conversationId}
        isLoading={conversations.isLoading}
        stats={conversations.stats}
        isOpen={sidebarOpen}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={conversations.deleteConversation}
        onSearchConversations={conversations.searchConversations}
        onToggle={() => setSidebarOpen(prev => !prev)}
        onRefresh={conversations.refresh}
      />

      <div className='flex-1 flex flex-col min-w-0'>
        <div className='bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            {!sidebarOpen && (
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSidebarOpen(true)}
                className='text-gray-600 hover:text-gray-800'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 6h16M4 12h16M4 18h16'
                  />
                </svg>
              </Button>
            )}

            <h1 className='text-lg font-semibold text-gray-900'>AI 對話中心</h1>
          </div>

          <div className='flex items-center space-x-2'>
            {chat.conversation && (
              <Button
                variant='outline'
                size='sm'
                onClick={handleExportConversation}
                className='text-gray-600 hover:text-gray-800'
              >
                導出對話
              </Button>
            )}

            <Button
              variant='outline'
              size='sm'
              onClick={handleNewConversation}
              className='text-gray-600 hover:text-gray-800'
            >
              新建對話
            </Button>
          </div>
        </div>

        <div className='flex-1 min-h-0'>
          <ChatInterface
            conversation={chat.conversation}
            messages={messages}
            isLoading={chat.isLoading}
            isStreaming={chat.isStreaming}
            onSendMessage={handleSendMessage}
            onUpdateConversation={handleUpdateConversation}
            onDeleteConversation={handleDeleteConversation}
            onNewConversation={handleNewConversation}
          />
        </div>

        {chat.error && (
          <div className='bg-red-50 border-t border-red-200 px-4 py-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <svg
                  className='w-5 h-5 text-red-500'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
                <span className='text-sm text-red-700'>{chat.error}</span>
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={chat.clearError}
                className='text-red-600 hover:text-red-800'
              >
                關閉
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
