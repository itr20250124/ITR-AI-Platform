import { useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message } from '../types';
import { ChatService } from '../services/chatService';
import { toast } from 'react-hot-toast';

export interface UseChatOptions {
  conversationId?: string;
  autoLoadMessages?: boolean;
  enableStreaming?: boolean;
}

export interface UseChatReturn {
  // 狀態
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  error: string | null;

  // 操作
  sendMessage: (content: string) => Promise<void>;
  createConversation: (title: string, aiProvider: string, parameters?: Record<string, any>) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  updateConversation: (updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: () => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  stopStreaming: () => void;
  clearError: () => void;
  exportConversation: () => Promise<string>;
}

export const useChat = (options: UseChatOptions = {}): UseChatReturn => {
  const { conversationId, autoLoadMessages = true, enableStreaming = true } = options;

  // 狀態
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 引用
  const streamingCancelRef = useRef<(() => void) | null>(null);
  const lastUserMessageRef = useRef<string>('');

  // 載入對話
  const loadConversation = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const [conversationData, messagesData] = await Promise.all([
        ChatService.getConversation(id),
        autoLoadMessages ? ChatService.getMessages(id) : Promise.resolve({ messages: [], total: 0 }),
      ]);

      setConversation(conversationData);
      setMessages(messagesData.messages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入對話失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [autoLoadMessages]);

  // 創建新對話
  const createConversation = useCallback(async (
    title: string,
    aiProvider: string,
    parameters: Record<string, any> = {}
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const newConversation = await ChatService.createConversation({
        title,
        aiProvider,
        parameters,
      });

      setConversation(newConversation);
      setMessages([]);
      toast.success('新對話已創建');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '創建對話失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 更新對話
  const updateConversation = useCallback(async (updates: Partial<Conversation>) => {
    if (!conversation) return;

    try {
      const updatedConversation = await ChatService.updateConversation(conversation.id, updates);
      setConversation(updatedConversation);
      
      if (updates.title) {
        toast.success('對話已更新');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新對話失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [conversation]);

  // 刪除對話
  const deleteConversation = useCallback(async () => {
    if (!conversation) return;

    try {
      await ChatService.deleteConversation(conversation.id);
      setConversation(null);
      setMessages([]);
      toast.success('對話已刪除');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刪除對話失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [conversation]);

  // 發送訊息
  const sendMessage = useCallback(async (content: string) => {
    if (!conversation || isLoading || isStreaming) return;

    lastUserMessageRef.current = content;

    try {
      setError(null);

      if (enableStreaming) {
        // 串流模式
        setIsStreaming(true);
        setStreamingMessage('');

        // 先添加用戶訊息到UI
        const userMessage: Message = {
          id: `temp-${Date.now()}`,
          conversationId: conversation.id,
          role: 'user',
          content,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);

        // 開始串流
        const cancelStreaming = ChatService.createStreamingChat(
          conversation.id,
          content,
          conversation.aiProvider,
          conversation.parameters,
          // onChunk
          (chunk: string) => {
            setStreamingMessage(prev => prev + chunk);
          },
          // onComplete
          (fullResponse: string) => {
            const assistantMessage: Message = {
              id: `assistant-${Date.now()}`,
              conversationId: conversation.id,
              role: 'assistant',
              content: fullResponse,
              timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, assistantMessage]);
            setStreamingMessage('');
            setIsStreaming(false);
            streamingCancelRef.current = null;
          },
          // onError
          (error: Error) => {
            setError(error.message);
            setIsStreaming(false);
            setStreamingMessage('');
            streamingCancelRef.current = null;
            toast.error('串流回應失敗');
          }
        );

        streamingCancelRef.current = cancelStreaming;
      } else {
        // 非串流模式
        setIsLoading(true);

        const assistantMessage = await ChatService.sendChatMessageWithContext(
          conversation.id,
          content,
          conversation.aiProvider,
          conversation.parameters
        );

        // 重新載入訊息以獲取最新狀態
        const messagesData = await ChatService.getMessages(conversation.id);
        setMessages(messagesData.messages);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發送訊息失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [conversation, isLoading, isStreaming, enableStreaming]);

  // 重新生成最後的回應
  const regenerateLastResponse = useCallback(async () => {
    if (!lastUserMessageRef.current) return;

    // 移除最後的助手回應
    setMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        return prev.slice(0, -1);
      }
      return prev;
    });

    // 重新發送最後的用戶訊息
    await sendMessage(lastUserMessageRef.current);
  }, [sendMessage]);

  // 停止串流
  const stopStreaming = useCallback(() => {
    if (streamingCancelRef.current) {
      streamingCancelRef.current();
      streamingCancelRef.current = null;
      setIsStreaming(false);
      setStreamingMessage('');
    }
  }, []);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 導出對話
  const exportConversation = useCallback(async (): Promise<string> => {
    if (!conversation) {
      throw new Error('沒有可導出的對話');
    }

    try {
      const exportText = await ChatService.exportConversation(conversation.id);
      toast.success('對話已導出');
      return exportText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '導出對話失敗';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [conversation]);

  // 初始載入
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  // 清理函數
  useEffect(() => {
    return () => {
      if (streamingCancelRef.current) {
        streamingCancelRef.current();
      }
    };
  }, []);

  return {
    // 狀態
    conversation,
    messages,
    isLoading,
    isStreaming,
    streamingMessage,
    error,

    // 操作
    sendMessage,
    createConversation,
    loadConversation,
    updateConversation,
    deleteConversation,
    regenerateLastResponse,
    stopStreaming,
    clearError,
    exportConversation,
  };
};