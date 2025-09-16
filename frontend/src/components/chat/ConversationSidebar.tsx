import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Conversation } from '../../types'
import { ConversationStats } from '../../services/chatService'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

interface ConversationSidebarProps {
  conversations: Conversation[]
  currentConversationId?: string
  isLoading: boolean
  stats: ConversationStats | null
  isOpen: boolean
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  onSearchConversations: (query: string) => void
  onToggle: () => void
  onRefresh: () => void
  className?: string
}

const providerIcons: Record<string, string> = {
  openai: '🤖',
  gemini: '✨',
}

const formatRelativeTime = (input: Date) => {
  const date = new Date(input)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return '剛剛'
  if (diffMinutes < 60) return `${diffMinutes} 分鐘前`
  if (diffHours < 24) return `${diffHours} 小時前`
  if (diffDays < 7) return `${diffDays} 天前`

  return new Intl.DateTimeFormat('zh-TW', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const getConversationPreview = (conversation: Conversation) => {
  if (!conversation.messages?.length) {
    return '尚無訊息'
  }

  const lastMessage = conversation.messages[conversation.messages.length - 1]
  const prefix = lastMessage.role === 'user' ? '我: ' : 'AI: '
  const content =
    lastMessage.content.length > 50 ? `${lastMessage.content.slice(0, 50)}...` : lastMessage.content

  return `${prefix}${content}`
}

const getProviderIcon = (provider: string) => {
  return providerIcons[provider] ?? '💬'
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversationId,
  isLoading,
  stats,
  isOpen,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onSearchConversations,
  onToggle,
  onRefresh,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f' && isOpen) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    onSearchConversations(value)
  }

  const handleDeleteClick = (event: React.MouseEvent, id: string) => {
    event.stopPropagation()
    setPendingDeleteId(id)
  }

  const confirmDelete = () => {
    if (!pendingDeleteId) return
    onDeleteConversation(pendingDeleteId)
    setPendingDeleteId(null)
  }

  const cancelDelete = () => setPendingDeleteId(null)

  const statistics = useMemo(() => stats, [stats])

  if (!isOpen) {
    return (
      <div
        className={`w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4 ${className}`}
      >
        <Button
          variant='ghost'
          size='sm'
          onClick={onToggle}
          className='text-gray-600 hover:text-gray-800 mb-4'
          title='展開側邊欄'
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

        <Button
          variant='ghost'
          size='sm'
          onClick={onNewConversation}
          className='text-gray-600 hover:text-gray-800'
          title='新建對話'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
        </Button>
      </div>
    )
  }

  return (
    <div className={`w-80 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      <div className='p-4 border-b border-gray-200 space-y-3'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>對話</h2>
          <div className='flex items-center space-x-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={onRefresh}
              className='text-gray-600 hover:text-gray-800'
              title='重新整理'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 4v6h6M20 20v-6h-6M5 19a9 9 0 0114-7.5M19 5a9 9 0 01-14 7.5'
                />
              </svg>
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={onToggle}
              className='text-gray-600 hover:text-gray-800'
              title='收合側邊欄'
            >
              <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </Button>
          </div>
        </div>

        <Button variant='primary' size='sm' onClick={onNewConversation} className='w-full'>
          <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          新建對話
        </Button>

        <div className='relative'>
          <input
            ref={searchInputRef}
            type='text'
            placeholder='搜尋對話...'
            value={searchQuery}
            onChange={event => handleSearch(event.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
          <svg
            className='absolute left-3 top-2.5 w-4 h-4 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
      </div>

      {statistics && (
        <div className='p-4 border-b border-gray-200'>
          <Card className='p-3'>
            <div className='grid grid-cols-2 gap-4 text-center'>
              <div>
                <div className='text-2xl font-bold text-blue-600'>
                  {statistics.totalConversations}
                </div>
                <div className='text-xs text-gray-600'>對話</div>
              </div>
              <div>
                <div className='text-2xl font-bold text-green-600'>{statistics.totalMessages}</div>
                <div className='text-xs text-gray-600'>訊息</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className='flex-1 overflow-y-auto'>
        {isLoading && conversations.length === 0 ? (
          <div className='p-4 text-center text-gray-500'>
            <div className='animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2' />
            載入中...
          </div>
        ) : conversations.length === 0 ? (
          <div className='p-4 text-center text-gray-500'>
            <div className='text-4xl mb-2'>💬</div>
            <p>目前尚無對話</p>
            <p className='text-sm mt-1'>點擊上方的「新建對話」開始使用</p>
          </div>
        ) : (
          <div className='space-y-1 p-2'>
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`relative p-3 rounded-lg cursor-pointer transition-colors group ${
                  currentConversationId === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className='flex items-start justify-between'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center space-x-2 mb-1'>
                      <span className='text-sm'>{getProviderIcon(conversation.aiProvider)}</span>
                      <h3 className='font-medium text-gray-900 truncate' title={conversation.title}>
                        {conversation.title}
                      </h3>
                    </div>
                    <p className='text-sm text-gray-600 truncate'>
                      {getConversationPreview(conversation)}
                    </p>
                    <div className='flex items-center justify-between mt-2 text-xs text-gray-500'>
                      <span>{formatRelativeTime(conversation.updatedAt)}</span>
                      <span>{conversation.messages?.length ?? 0} 則訊息</span>
                    </div>
                  </div>

                  <button
                    onClick={event => handleDeleteClick(event, conversation.id)}
                    className='opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-400 hover:text-red-500 transition-all'
                    title='刪除對話'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingDeleteId && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-sm mx-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>確認刪除</h3>
            <p className='text-gray-600 mb-4'>確定要刪除此對話嗎？此動作無法復原。</p>
            <div className='flex space-x-3'>
              <Button variant='outline' onClick={cancelDelete} className='flex-1'>
                取消
              </Button>
              <Button
                onClick={confirmDelete}
                className='flex-1 bg-red-500 hover:bg-red-600 text-white'
              >
                刪除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
