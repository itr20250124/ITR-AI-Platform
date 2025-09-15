import { apiClient } from './api';
import { Conversation, Message } from '../types';

export interface CreateConversationRequest {
  title: string;
  aiProvider: string;
  parameters?: Record<string, any>;
}

export interface SendMessageRequest {
  message: string;
  provider: string;
  parameters?: Record<string, any>;
}

export interface UpdateConversationRequest {
  title?: string;
  aiProvider?: string;
  parameters?: Record<string, any>;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
}

export interface ConversationStats {
  totalConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  providerUsage: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
}

export class ChatService {
  /**
   * 創建新對話
   */
  static async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    const response = await apiClient.post('/conversations', data);
    return response.data.data;
  }

  /**
   * 獲取用戶的對話列表
   */
  static async getConversations(options: {
    limit?: number;
    offset?: number;
    orderBy?: 'createdAt' | 'updatedAt';
    order?: 'asc' | 'desc';
  } = {}): Promise<ConversationListResponse> {
    const response = await apiClient.get('/conversations', { params: options });
    return response.data.data;
  }

  /**
   * 根據ID獲取對話詳情
   */
  static async getConversation(conversationId: string): Promise<Conversation> {
    const response = await apiClient.get(`/conversations/${conversationId}`);
    return response.data.data;
  }

  /**
   * 更新對話
   */
  static async updateConversation(
    conversationId: string,
    data: UpdateConversationRequest
  ): Promise<Conversation> {
    const response = await apiClient.put(`/conversations/${conversationId}`, data);
    return response.data.data;
  }

  /**
   * 刪除對話
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/conversations/${conversationId}`);
  }

  /**
   * 獲取對話的訊息歷史
   */
  static async getMessages(
    conversationId: string,
    options: {
      limit?: number;
      offset?: number;
      before?: Date;
      after?: Date;
    } = {}
  ): Promise<MessageListResponse> {
    const params = {
      ...options,
      before: options.before?.toISOString(),
      after: options.after?.toISOString(),
    };
    
    const response = await apiClient.get(`/conversations/${conversationId}/messages`, { params });
    return response.data.data;
  }

  /**
   * 添加訊息到對話
   */
  static async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: Record<string, any>
  ): Promise<Message> {
    const response = await apiClient.post(`/conversations/${conversationId}/messages`, {
      role,
      content,
      metadata,
    });
    return response.data.data;
  }

  /**
   * 發送聊天訊息並獲取AI回應
   */
  static async sendChatMessage(
    conversationId: string,
    message: string,
    provider: string,
    parameters: Record<string, any> = {}
  ): Promise<Message> {
    // 首先添加用戶訊息
    await this.addMessage(conversationId, 'user', message);

    // 發送到AI服務獲取回應
    const response = await apiClient.post('/ai/chat', {
      message,
      provider,
      parameters,
    });

    const aiResponse = response.data.data;

    // 添加AI回應到對話
    const assistantMessage = await this.addMessage(
      conversationId,
      'assistant',
      aiResponse.content,
      {
        usage: aiResponse.usage,
        model: parameters.model,
        finishReason: aiResponse.metadata?.finishReason,
      }
    );

    return assistantMessage;
  }

  /**
   * 發送帶上下文的聊天訊息
   */
  static async sendChatMessageWithContext(
    conversationId: string,
    message: string,
    provider: string,
    parameters: Record<string, any> = {}
  ): Promise<Message> {
    // 獲取對話歷史
    const messagesResponse = await this.getMessages(conversationId, { limit: 20 });
    const conversationMessages = messagesResponse.messages;

    // 構建上下文訊息
    const contextMessages = conversationMessages.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // 添加當前用戶訊息
    contextMessages.push({ role: 'user', content: message });

    // 添加用戶訊息到對話
    await this.addMessage(conversationId, 'user', message);

    // 發送到AI服務獲取回應
    const response = await apiClient.post('/ai/chat/context', {
      messages: contextMessages,
      provider,
      parameters,
    });

    const aiResponse = response.data.data;

    // 添加AI回應到對話
    const assistantMessage = await this.addMessage(
      conversationId,
      'assistant',
      aiResponse.content,
      {
        usage: aiResponse.usage,
        model: parameters.model,
        finishReason: aiResponse.metadata?.finishReason,
      }
    );

    return assistantMessage;
  }

  /**
   * 搜索對話
   */
  static async searchConversations(
    query: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ConversationListResponse> {
    const response = await apiClient.get('/conversations/search', {
      params: { q: query, ...options },
    });
    return response.data.data;
  }

  /**
   * 獲取對話統計
   */
  static async getConversationStats(): Promise<ConversationStats> {
    const response = await apiClient.get('/conversations/stats');
    return response.data.data;
  }

  /**
   * 創建串流聊天連接
   */
  static createStreamingChat(
    conversationId: string,
    message: string,
    provider: string,
    parameters: Record<string, any> = {},
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): () => void {
    let abortController: AbortController | null = null;

    const startStreaming = async () => {
      try {
        abortController = new AbortController();

        // 添加用戶訊息
        await this.addMessage(conversationId, 'user', message);

        // 獲取對話歷史用於上下文
        const messagesResponse = await this.getMessages(conversationId, { limit: 20 });
        const conversationMessages = messagesResponse.messages;

        const contextMessages = conversationMessages
          .filter(msg => msg.content !== message) // 排除剛添加的用戶訊息
          .map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }));

        contextMessages.push({ role: 'user', content: message });

        // 創建串流請求
        const response = await fetch('/api/ai/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            messages: contextMessages,
            provider,
            parameters,
          }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body reader available');
        }

        let fullResponse = '';
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // 串流結束，保存完整回應
                await this.addMessage(conversationId, 'assistant', fullResponse, {
                  model: parameters.model,
                  streaming: true,
                });
                onComplete(fullResponse);
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullResponse += parsed.content;
                  onChunk(parsed.content);
                }
              } catch (e) {
                // 忽略解析錯誤，繼續處理下一行
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // 用戶取消，不報錯
          return;
        }
        onError(error instanceof Error ? error : new Error('Unknown streaming error'));
      }
    };

    startStreaming();

    // 返回取消函數
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }

  /**
   * 導出對話為文本
   */
  static async exportConversation(conversationId: string): Promise<string> {
    const conversation = await this.getConversation(conversationId);
    const messagesResponse = await this.getMessages(conversationId);
    
    let exportText = `# ${conversation.title}\n\n`;
    exportText += `**AI Provider:** ${conversation.aiProvider}\n`;
    exportText += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
    exportText += `**Messages:** ${messagesResponse.messages.length}\n\n`;
    exportText += '---\n\n';

    for (const message of messagesResponse.messages) {
      const timestamp = new Date(message.timestamp).toLocaleString();
      const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
      
      exportText += `## ${role} (${timestamp})\n\n`;
      exportText += `${message.content}\n\n`;
    }

    return exportText;
  }

  /**
   * 生成對話標題建議
   */
  static async generateTitleSuggestion(conversationId: string): Promise<string> {
    const messagesResponse = await this.getMessages(conversationId, { limit: 5 });
    const messages = messagesResponse.messages;

    if (messages.length === 0) {
      return '新對話';
    }

    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) {
      return '新對話';
    }

    // 簡單的標題生成邏輯
    let title = firstUserMessage.content;
    
    // 移除常見開場白
    const greetings = ['你好', 'hello', 'hi', '請問', '我想', '能否', '可以'];
    for (const greeting of greetings) {
      if (title.toLowerCase().startsWith(greeting)) {
        title = title.substring(greeting.length).trim();
        break;
      }
    }

    // 限制長度
    if (title.length > 30) {
      title = title.substring(0, 27) + '...';
    }

    return title || '新對話';
  }
}