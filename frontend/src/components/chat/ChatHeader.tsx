import React, { useMemo, useState } from 'react';
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

const providerNames: Record<string, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
};

const providerIcons: Record<string, string> = {
  openai: '🤖',
  gemini: '✨',
};

const formatCreatedTime = (createdAt: Date) => {
  const date = new Date(createdAt);
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  onUpdateConversation,
  onDeleteConversation,
  onNewConversation,
  className = '',
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [menuOpen, setMenuOpen] = useState(false);

  const providerName = useMemo(
    () => providerNames[conversation.aiProvider] ?? conversation.aiProvider,
    [conversation.aiProvider]
  );

  const providerIcon = useMemo(
    () => providerIcons[conversation.aiProvider] ?? '💬',
    [conversation.aiProvider]
  );

  if (process.env.NODE_ENV === 'test') {
    console.log('render header', conversation.title);
  }
  const handleTitleSave = () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === conversation.title) {
      setEditTitle(conversation.title);
      setIsEditingTitle(false);
      return;
    }

    onUpdateConversation({ title: trimmed });
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleTitleSave();
    }
    if (event.key === 'Escape') {
      setEditTitle(conversation.title);
      setIsEditingTitle(false);
    }
  };

  const handleModelChange = (provider: string, parameters?: Record<string, unknown>) => {
    onUpdateConversation({
      aiProvider: provider,
      parameters: parameters ?? conversation.parameters,
    });
  };

  return (
    <div className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={editTitle}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                onChange={(event) => setEditTitle(event.target.value)}
                className="w-full px-2 py-1 text-lg font-semibold bg-transparent border-b-2 border-blue-500 focus:outline-none"
                autoFocus
                maxLength={200}
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-left w-full truncate text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                title={conversation.title}
              >
                {conversation.title}
              </button>
            )}

            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
              <span>{providerIcon}</span>
              <span>{providerName}</span>
              <span>•</span>
              <span>建立於 {formatCreatedTime(conversation.createdAt)}</span>
              <span>•</span>
              <span>{conversation.messages?.length ?? 0} 則訊息</span>
            </div>
          </div>

          <AIModelSelector
            currentProvider={conversation.aiProvider}
            currentParameters={conversation.parameters}
            onModelChange={handleModelChange}
          />
        </div>

        <div className="flex items-center space-x-2 ml-4">
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

          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="text-gray-600 hover:text-gray-800"
              title="更多選項"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </Button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsEditingTitle(true);
                      setMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    重新命名
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteConversation();
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

      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
};
