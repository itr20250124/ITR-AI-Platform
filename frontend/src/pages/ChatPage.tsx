import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatInterface } from '../components/chat/ChatInterface';
import { ConversationSidebar } from '../components/chat/ConversationSidebar';
import { useChat } from '../hooks/useChat';
import { useConversations } from '../hooks/useConversations';
import { Button } from '../components/ui/Button';
import { toast } from 'react-hot-toast';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState('openai');

  // 聊天Hook
  const chat = useChat({
    conversationId,
    enableStreaming: true,
  });

  // 對話列表Hook
  const conversations = useConversations({
    autoLoad: true,
  });

  // 處理新建對話
  const handleNewConversation = async () => {
    try {
      const title = await chat.conversation 
        ? `新對話 ${new Date().toLocaleTimeString()}`
        : '新對話';
      
      const newConversation = await conversations.createConversation(
        title,
        selectedProvider,
        getDefaultParameters(selectedProvider)
      );
      
      navigate(`/chat/${newConversation.id}`);
    } catch (error) {
      console.error('創建對話失敗:', error);
    }
  };

  // 處理選擇對話
  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`);
  };

  // 處理發送訊息
  const handleSendMessage = async (content: string) => {
    if (!chat.conversation) {
      // 如果沒有當前對話，先創建一個
      try {
        const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
        const newConversation = await conversations.createConversation(
          title,
          selectedProvider,
          getDefaultParameters(selectedProvider)
        );
        
        navigate(`/chat/${newConversation.id}`);
        
        // 等待對話載入後再發送訊息
        setTimeout(() => {
          chat.sendMessage(content);
        }, 100);
      } catch (error) {
        toast.error('創建對話失敗');
        return;
      }
    } else {
      await chat.sendMessage(content);
    }
  };

  // 處理更新對話
  const handleUpdateConversation = async (updates: Partial<any>) => {
    if (!chat.conversation) return;
    
    await chat.updateConversation(updates);
    
    // 同時更新對話列表中的對話
    await conversations.updateConversation(chat.conversation.id, updates);
  };

  // 處理刪除對話
  const handleDeleteConversation = async () => {
    if (!chat.conversation) return;
    
    await chat.deleteConversation();
    await conversations.deleteConversation(chat.conversation.id);
    
    // 導航到聊天首頁
    navigate('/chat');
  };

  // 處理導出對話
  const handleExportConversation = async () => {
    try {
      const exportText = await chat.exportConversation();
      
      // 創建下載鏈接
      const blob = new Blob([exportText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${chat.conversation?.title || '對話'}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('導出對話失敗:', error);
    }
  };

  // 獲取預設參數
  const getDefaultParameters = (provider: string): Record<string, any> => {
    const defaults: Record<string, Record<string, any>> = {
      openai: {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 1000,
      },
      gemini: {
        model: 'gemini-pro',
        temperature: 0.9,
        maxOutputTokens: 2048,
      },
    };
    
    return defaults[provider] || {};
  };

  // 處理鍵盤快捷鍵
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: 新建對話
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewConversation();
      }
      
      // Ctrl/Cmd + B: 切換側邊欄
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 側邊欄 */}
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
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onRefresh={conversations.refresh}
      />

      {/* 主聊天區域 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 頂部工具欄 */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            )}
            
            <h1 className="text-lg font-semibold text-gray-900">
              AI 聊天助手
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {chat.conversation && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportConversation}
                className="text-gray-600 hover:text-gray-800"
              >
                導出對話
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewConversation}
              className="text-gray-600 hover:text-gray-800"
            >
              新建對話
            </Button>
          </div>
        </div>

        {/* 聊天介面 */}
        <div className="flex-1 min-h-0">
          <ChatInterface
            conversation={chat.conversation}
            messages={[...chat.messages, ...(chat.streamingMessage ? [{
              id: 'streaming',
              conversationId: chat.conversation?.id || '',
              role: 'assistant' as const,
              content: chat.streamingMessage,
              timestamp: new Date(),
            }] : [])]}
            isLoading={chat.isLoading}
            isStreaming={chat.isStreaming}
            onSendMessage={handleSendMessage}
            onUpdateConversation={handleUpdateConversation}
            onDeleteConversation={handleDeleteConversation}
            onNewConversation={handleNewConversation}
          />
        </div>

        {/* 錯誤提示 */}
        {chat.error && (
          <div className="bg-red-50 border-t border-red-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">{chat.error}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={chat.clearError}
                className="text-red-600 hover:text-red-800"
              >
                關閉
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};