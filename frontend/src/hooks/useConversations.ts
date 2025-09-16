import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../types';
import { ChatService, ConversationStats } from '../services/chatService';
import { toast } from 'react-hot-toast';

export interface UseConversationsOptions {
  autoLoad?: boolean;
  limit?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface UseConversationsReturn {
  // 狀態
  conversations: Conversation[];
  stats: ConversationStats | null;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;

  // 操作
  loadConversations: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  searchConversations: (query: string) => Promise<void>;
  createConversation: (title: string, aiProvider: string, parameters?: Record<string, any>) => Promise<Conversation>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  loadStats: () => Promise<void>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

export const useConversations = (options: UseConversationsOptions = {}): UseConversationsReturn => {
  const {
    autoLoad = true,
    limit = 20,
    orderBy = 'updatedAt',
    order = 'desc',
  } = options;

  // 狀態
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 載入對話列表
  const loadConversations = useCallback(async (refresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentOffset = refresh ? 0 : offset;
      
      let response;
      if (searchQuery) {
        response = await ChatService.searchConversations(searchQuery, {
          limit,
          offset: currentOffset,
        });
      } else {
        response = await ChatService.getConversations({
          limit,
          offset: currentOffset,
          orderBy,
          order,
        });
      }

      if (refresh) {
        setConversations(response.conversations);
        setOffset(response.conversations.length);
      } else {
        setConversations(prev => [...prev, ...response.conversations]);
        setOffset(prev => prev + response.conversations.length);
      }

      setTotal(response.total);
      setHasMore(response.conversations.length === limit && offset + response.conversations.length < response.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入對話列表失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [limit, orderBy, order, offset, searchQuery]);

  // 載入更多對話
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadConversations(false);
  }, [hasMore, isLoading, loadConversations]);

  // 搜索對話
  const searchConversations = useCallback(async (query: string) => {
    setSearchQuery(query);
    setOffset(0);
    setConversations([]);
    setHasMore(true);
    
    if (query.trim()) {
      await loadConversations(true);
    } else {
      // 清空搜索，重新載入所有對話
      await loadConversations(true);
    }
  }, [loadConversations]);

  // 創建新對話
  const createConversation = useCallback(async (
    title: string,
    aiProvider: string,
    parameters: Record<string, any> = {}
  ): Promise<Conversation> => {
    try {
      const newConversation = await ChatService.createConversation({
        title,
        aiProvider,
        parameters,
      });

      // 將新對話添加到列表頂部
      setConversations(prev => [newConversation, ...prev]);
      setTotal(prev => prev + 1);
      
      toast.success('對話已建立');
      return newConversation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立對話失敗';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  // 更新對話
  const updateConversation = useCallback(async (
    id: string,
    updates: Partial<Conversation>
  ) => {
    try {
      const updatedConversation = await ChatService.updateConversation(id, updates);
      
      setConversations(prev =>
        prev.map(conv =>
          conv.id === id ? { ...conv, ...updatedConversation } : conv
        )
      );

      if (updates.title) {
        toast.success('對話已更新');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新對話失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  // 刪除對話
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await ChatService.deleteConversation(id);
      
      setConversations(prev => prev.filter(conv => conv.id !== id));
      setTotal(prev => prev - 1);
      
      toast.success('對話已刪除');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刪除對話失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, []);

  // 載入統計信息
  const loadStats = useCallback(async () => {
    try {
      const statsData = await ChatService.getConversationStats();
      setStats(statsData);
    } catch (err) {
      console.error('載入統計信息失敗:', err);
      // 統計信息載入失敗不顯示錯誤提示，因為不是關鍵功能
    }
  }, []);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 刷新
  const refresh = useCallback(async () => {
    setOffset(0);
    setConversations([]);
    setHasMore(true);
    await Promise.all([
      loadConversations(true),
      loadStats(),
    ]);
  }, [loadConversations, loadStats]);

  // 初始載入
  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad]); // 只在 autoLoad 變化時執行

  // 當搜索查詢變化時重新載入
  useEffect(() => {
    if (searchQuery !== '') {
      loadConversations(true);
    }
  }, [searchQuery]); // 只依賴 searchQuery

  return {
    // 狀態
    conversations,
    stats,
    isLoading,
    error,
    hasMore,
    total,

    // 操作
    loadConversations,
    loadMore,
    searchConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    loadStats,
    clearError,
    refresh,
  };
};
