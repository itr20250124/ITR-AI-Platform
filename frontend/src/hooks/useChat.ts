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
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  error: string | null;
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

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const streamingCancelRef = useRef<(() => void) | null>(null);
  const lastUserMessageRef = useRef<string>('');

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

  const createConversation = useCallback(async (
    title: string,
    aiProvider: string,
    parameters: Record<string, any> = {},
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
      toast.success('對話已建立');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立對話失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const sendMessage = useCallback(async (content: string) => {
    if (!conversation || !content.trim() || isLoading) {
      return;
    }

    lastUserMessageRef.current = content;

    if (enableStreaming) {
      try {
        setIsStreaming(true);
        setStreamingMessage('');

        const cancelStreaming = await ChatService.streamChatMessage(
          conversation.id,
          {
            message: content,
            provider: conversation.aiProvider,
            parameters: conversation.parameters,
          },
          (chunk) => {
            setStreamingMessage((prev) => prev + chunk);
          },
          (fullResponse) => {
            const assistantMessage: Message = {
              id: `stream-${Date.now()}`,
              conversationId: conversation.id,
              role: 'assistant',
              content: fullResponse,
              timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setStreamingMessage('');
            setIsStreaming(false);
            streamingCancelRef.current = null;
          },
          (streamError) => {
            setError(streamError.message);
            setIsStreaming(false);
            setStreamingMessage('');
            streamingCancelRef.current = null;
            toast.error('串流請求失敗');
          },
        );

        streamingCancelRef.current = cancelStreaming;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '傳送訊息失敗';
        setError(errorMessage);
        toast.error(errorMessage);
      }
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await ChatService.sendChatMessageWithContext(
        conversation.id,
        content,
        conversation.aiProvider,
        conversation.parameters,
      );

      const messagesResponse = await ChatService.getMessages(conversation.id);
      setMessages(messagesResponse.messages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '傳送訊息失敗';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [conversation, isLoading, enableStreaming]);

  const regenerateLastResponse = useCallback(async () => {
    if (!lastUserMessageRef.current) return;

    setMessages((prev) => {
      const next = [...prev];
      const lastMessage = next[next.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        next.pop();
      }
      return next;
    });

    await sendMessage(lastUserMessageRef.current);
  }, [sendMessage]);

  const stopStreaming = useCallback(() => {
    if (streamingCancelRef.current) {
      streamingCancelRef.current();
      streamingCancelRef.current = null;
      setIsStreaming(false);
      setStreamingMessage('');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const exportConversation = useCallback(async () => {
    if (!conversation) {
      throw new Error('尚未選擇對話');
    }

    try {
      const exportText = await ChatService.exportConversation(conversation.id);
      toast.success('對話已匯出');
      return exportText;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '匯出對話失敗';
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, [conversation]);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  useEffect(() => () => {
    if (streamingCancelRef.current) {
      streamingCancelRef.current();
    }
  }, []);

  return {
    conversation,
    messages,
    isLoading,
    isStreaming,
    streamingMessage,
    error,
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
