import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../../types';
import { ConversationStats } from '../../services/chatService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId?: string;
  isLoading: boolean;
  stats: ConversationStats | null;
  isOpen: boolean;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onSearchConversations: (query: string) => void;
  onToggle: () => void;
  onRefresh: () => void;
  className?: string;
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 處理搜索
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearchConversations(query);
  };

  // 處理刪除確認
  const handleDeleteClick = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setShowDeleteConfirm(conversationId);
  };

  const handleDeleteConfirm = (conversationId: string) => {
    onDeleteConversation(conversationId);
    setShowDeleteConfirm(null);
  };

  // 格式化時間
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins}分鐘前`;
    if (diffHours < 24) return `${diffHours}小時前`;
    if (diffDays < 7) return `${diffDays}天前`;
    
    return new Intl.DateTimeFormat('zh-TW', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  // 獲取對話預覽
  const getConversationPreview = (conversation: Conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      const lastMessage = conversation.messages[conversation.messages.length - 1];
      const preview = lastMessage.content.length > 50 
        ? lastMessage.content.substring(0, 50) + '...'
        : lastMessage.content;
      return `${lastMessage.role === 'user' ? '你: ' : 'AI: '}${preview}`;
    }
    return '尚無訊息';
  };

  // 獲取AI提供商圖標
  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      'openai': '🤖',
      'gemini': '✨',
    };
    return icons[provider] || '🤖';
  };

  // 鍵盤快捷鍵
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F: 聚焦搜索框
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && isOpen) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <div className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-gray-600 hover:text-gray-800 mb-4"
          title="展開側邊欄"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewConversation}
          className="text-gray-600 hover:text-gray-800"
          title="新建對話"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>
    );
  }

  return (
    <div className={`w-80 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* 標題欄 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">對話</h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="text-gray-600 hover:text-gray-800"
              title="刷新"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-gray-600 hover:text-gray-800"
              title="收起側邊欄"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </Button>
          </div>
        </div>

        {/* 新建對話按鈕 */}
        <Button
          onClick={onNewConversation}
          className="w-full mb-4"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建對話
        </Button>

        {/* 搜索框 */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索對話..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* 統計信息 */}
      {stats && (
        <div className="p-4 border-b border-gray-200">
          <Card className="p-3">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats.totalConversations}</div>
                <div className="text-xs text-gray-600">對話</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.totalMessages}</div>
                <div className="text-xs text-gray-600">訊息</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 對話列表 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            載入中...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>尚無對話</p>
            <p className="text-sm mt-1">點擊上方按鈕開始新對話</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`relative p-3 rounded-lg cursor-pointer transition-colors group ${
                  currentConversationId === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm">{getProviderIcon(conversation.aiProvider)}</span>
                      <h3 className="font-medium text-gray-900 truncate">
                        {conversation.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {getConversationPreview(conversation)}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.updatedAt)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {conversation.messages?.length || 0} 條訊息
                      </span>
                    </div>
                  </div>

                  {/* 刪除按鈕 */}
                  <button
                    onClick={(e) => handleDeleteClick(e, conversation.id)}
                    className="opacity-0 group-hover:opacity-100 ml-2 p-1 text-gray-400 hover:text-red-500 transition-all"
                    title="刪除對話"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 刪除確認對話框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">確認刪除</h3>
            <p className="text-gray-600 mb-4">
              確定要刪除這個對話嗎？此操作無法撤銷。
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                刪除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};