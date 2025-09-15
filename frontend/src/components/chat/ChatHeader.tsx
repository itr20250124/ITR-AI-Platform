import React, { useState } from 'react';
import { Conversation } from '../../types';
import { Button } from '../ui/Button';
import { AIModelSelector } from './AIModelSelector';

interface ChatHeaderProps {
  conversation: Conversation;
  onUpdateConversation: (updates: Partial<Conversation>) => void;
  onDeleteConversation: () => void;
  onNewConversation: () => void;
  className?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onUpdateConversation,
  onDeleteConversation,
  onNewConversation,
  className = '',
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [showDropdown, setShowDropdown] = useState(false);

  // 處理標題編輯
  const handleTitleEdit = () => {
    setIsEditingTitle(true);
    setEditTitle(conversation.title);
  };

  const handleTitleSave = () => {
    const trimmedTitle = editTitle.trim();
    if (trimmedTitle && trimmedTitle !== conversation.title) {
      onUpdateConversation({ title: trimmedTitle });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(conversation.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  // 處理AI模型變更
  const handleModelChange = (aiProvider: string, parameters?: Record<string, any>) => {
    onUpdateConversation({ 
      aiProvider, 
      parameters: parameters || conversation.parameters 
    });
  };

  // 獲取AI提供商顯示名稱
  const getProviderDisplayName = (provider: string) => {
    const names: Record<string, string> = {
      'openai': 'OpenAI',
      'gemini': 'Google Gemini',
    };
    return names[provider] || provider;
  };

  // 獲取AI提供商圖標
  const getProviderIcon = (provider: string) => {
    const icons: Record<string, string> = {
      'openai': '🤖',
      'gemini': '✨',
    };
    return icons[provider] || '🤖';
  };

  // 格式化對話創建時間
  const formatCreatedTime = (createdAt: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(createdAt));
  };

  return (
    <div className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* 左側：標題和AI模型信息 */}
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          {/* 對話標題 */}
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="w-full px-2 py-1 text-lg font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none"
                autoFocus
                maxLength={200}
              />
            ) : (
              <button
                onClick={handleTitleEdit}
                className="text-left w-full truncate text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                title={conversation.title}
              >
                {conversation.title}
              </button>
            )}
            
            {/* 對話信息 */}
            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
              <div className="flex items-center space-x-1">
                <span>{getProviderIcon(conversation.aiProvider)}</span>
                <span>{getProviderDisplayName(conversation.aiProvider)}</span>
              </div>
              <span>•</span>
              <span>{formatCreatedTime(conversation.createdAt)}</span>
              <span>•</span>
              <span>{conversation.messages?.length || 0} 條訊息</span>
            </div>
          </div>

          {/* AI模型選擇器 */}
          <AIModelSelector
            currentProvider={conversation.aiProvider}
            currentParameters={conversation.parameters}
            onModelChange={handleModelChange}
          />
        </div>

        {/* 右側：操作按鈕 */}
        <div className="flex items-center space-x-2 ml-4">
          {/* 新建對話 */}
          <Button
            variant="outline"
            size="sm"
            onClick={onNewConversation}
            className="text-gray-600 hover:text-gray-800"
            title="新建對話"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Button>

          {/* 更多操作 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-gray-600 hover:text-gray-800"
              title="更多操作"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>

            {/* 下拉菜單 */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleTitleEdit();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    重命名對話
                  </button>
                  <button
                    onClick={() => {
                      // 導出對話功能
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    導出對話
                  </button>
                  <div className="border-t border-gray-100"></div>
                  <button
                    onClick={() => {
                      if (confirm('確定要刪除這個對話嗎？此操作無法撤銷。')) {
                        onDeleteConversation();
                      }
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    刪除對話
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 點擊外部關閉下拉菜單 */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};