import { Response } from 'express';
import { AuthenticatedRequest, AIServiceError } from '../types';
import { ConversationService, ConversationContextManager } from '../services/conversation';
import { AIServiceFactory } from '../services/ai/AIServiceFactory';

const NUMERIC_CHAT_PARAMETER_KEYS = [
  'temperature',
  'maxTokens',
  'topP',
  'frequencyPenalty',
  'presencePenalty',
  'maxOutputTokens',
  'topK',
];

const normalizeChatParameters = (parameters: Record<string, any> = {}): Record<string, any> => {
  const normalized: Record<string, any> = { ...parameters };

  for (const key of NUMERIC_CHAT_PARAMETER_KEYS) {
    if (normalized[key] !== undefined) {
      const value = normalized[key];
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (!Number.isNaN(parsed)) {
          normalized[key] = parsed;
        } else {
          delete normalized[key];
        }
      }
    }
  }

  return normalized;
};

/**
 * 創建新對話
 */
export const createConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { title, aiProvider, parameters } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用戶未認證',
        },
      });
      return;
    }

    if (!title || !aiProvider) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: '缺少必要欄位：title, aiProvider',
        },
      });
      return;
    }

    const conversation = await ConversationService.createConversation({
      userId,
      title,
      aiProvider,
      parameters,
    });

    res.status(201).json({
      success: true,
      data: conversation,
      message: '對話創建成功',
    });
  } catch (error) {
    console.error('Create conversation error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '創建對話失敗',
      },
    });
  }
};

/**
 * 獲取用戶的所有對話
 */
export const getUserConversations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { limit, offset, orderBy, order } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用戶未認證',
        },
      });
      return;
    }

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      orderBy: orderBy as 'createdAt' | 'updatedAt' | undefined,
      order: order as 'asc' | 'desc' | undefined,
    };

    const result = await ConversationService.getUserConversations(userId, options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get user conversations error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取對話列表失敗',
      },
    });
  }
};

/**
 * 根據ID獲取對話詳情
 */
export const getConversationById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用戶未認證',
        },
      });
      return;
    }

    const conversation = await ConversationService.getConversationById(conversationId, userId);

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: '對話不存在或無權限訪問',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Get conversation by id error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取對話詳情失敗',
      },
    });
  }
};

/**
 * 更新對話
 */
export const updateConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { title, aiProvider, parameters } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用戶未認證',
        },
      });
      return;
    }

    const conversation = await ConversationService.updateConversation(conversationId, userId, {
      title,
      aiProvider,
      parameters,
    });

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: '對話不存在或無權限訪問',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: conversation,
      message: '對話更新成功',
    });
  } catch (error) {
    console.error('Update conversation error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '更新對話失敗',
      },
    });
  }
};

/**
 * 刪除對話
 */
export const deleteConversation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用戶未認證',
        },
      });
      return;
    }

    const success = await ConversationService.deleteConversation(conversationId, userId);

    if (!success) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: '對話不存在或無權限訪問',
        },
      });
      return;
    }

    res.json({
      success: true,
      message: '對話刪除成功',
    });
  } catch (error) {
    console.error('Delete conversation error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '刪除對話失敗',
      },
    });
  }
};

/**
 * 添加訊息到對話
 */
export const addMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { role, content, metadata } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用戶未認證',
        },
      });
      return;
    }

    if (!role || !content) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: '缺少必要欄位：role, content',
        },
      });
      return;
    }

    if (!['user', 'assistant'].includes(role)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'role必須是user或assistant',
        },
      });
      return;
    }

    // 驗證用戶是否有權限訪問此對話
    const conversation = await ConversationService.getConversationById(conversationId, userId);
    if (!conversation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: '對話不存在或無權限訪問',
        },
      });
      return;
    }

    const message = await ConversationService.addMessage({
      conversationId,
      role,
      content,
      metadata,
    });

    res.status(201).json({
      success: true,
      data: message,
      message: '訊息添加成功',
    });
  } catch (error) {
    console.error('Add message error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '添加訊息失敗',
      },
    });
  }
};

/**
 * 獲取對話的訊息歷史
 */
export const getConversationMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { limit, offset, before, after } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用戶未認證',
        },
      });
      return;
    }

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      before: before ? new Date(before as string) : undefined,
      after: after ? new Date(after as string) : undefined,
    };

    const result = await ConversationService.getConversationMessages(
      conversationId,
      userId,
      options
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get conversation messages error:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: '對話不存在或無權限訪問',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取訊息歷史失敗',
      },
    });
  }
};

/**
 * 搜索對話
 */
export const searchConversations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { q: query, limit, offset } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用戶未認證',
        },
      });
      return;
    }

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_QUERY',
          message: '缺少搜索關鍵字',
        },
      });
      return;
    }

    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    };

    const result = await ConversationService.searchConversations(userId, query, options);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Search conversations error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '搜索對話失敗',
      },
    });
  }
};

/**
 * 獲取對話統計
 */
export const getConversationStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用戶未認證',
        },
      });
      return;
    }

    const stats = await ConversationService.getConversationStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get conversation stats error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取對話統計失敗',
      },
    });
  }
};

/**
 * 對話內向 AI 發送訊息
 */
export const sendConversationMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { message, provider, parameters = {} } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '使用者未授權',
        },
      });
      return;
    }

    const conversation = await ConversationService.getConversationById(conversationId, userId);

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: '對話不存在或無法訪問',
        },
      });
      return;
    }

    const resolvedProvider = provider || conversation.aiProvider;
    const resolvedParameters = normalizeChatParameters({
      ...(conversation.parameters || {}),
      ...(parameters || {}),
    });

    await ConversationService.addMessage({
      conversationId,
      role: 'user',
      content: message,
    });

    const recentMessages = await ConversationService.getRecentMessages(conversationId, userId, 30);
    const systemPrompt =
      typeof resolvedParameters.systemPrompt === 'string'
        ? resolvedParameters.systemPrompt
        : undefined;
    const maxContextTokens =
      typeof resolvedParameters.maxTokens === 'number'
        ? resolvedParameters.maxTokens
        : typeof resolvedParameters.maxOutputTokens === 'number'
          ? resolvedParameters.maxOutputTokens
          : undefined;

    const context = ConversationContextManager.buildContext(
      recentMessages,
      systemPrompt,
      maxContextTokens
    );

    const chatService = AIServiceFactory.createChatService(resolvedProvider);
    const aiResponse = await chatService.sendMessageWithContext(
      context.messages,
      resolvedParameters
    );

    res.json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    console.error('Send conversation message error:', error);

    if (error instanceof AIServiceError) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          provider: error.provider,
        },
      });
      return;
    }

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: '對話不存在或無法訪問',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '發送訊息失敗',
      },
    });
  }
};

/**
 * 對話內串流取得 AI 回覆
 */
export const streamConversationMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const { message, provider, parameters = {}, context } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '使用者未授權',
        },
      });
      return;
    }

    const conversation = await ConversationService.getConversationById(conversationId, userId);

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: '對話不存在或無法訪問',
        },
      });
      return;
    }

    const resolvedProvider = provider || conversation.aiProvider;
    const resolvedParameters = normalizeChatParameters({
      ...(conversation.parameters || {}),
      ...(parameters || {}),
    });

    await ConversationService.addMessage({
      conversationId,
      role: 'user',
      content: message,
    });

    let contextMessages:
      | Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
      | undefined;

    if (Array.isArray(context) && context.length > 0) {
      contextMessages = context
        .map((item: any) => ({
          role: item.role === 'assistant' || item.role === 'system' ? item.role : 'user',
          content: typeof item.content === 'string' ? item.content : String(item.content ?? ''),
        }))
        .filter(item => item.content.trim().length > 0);
    }

    if (!contextMessages || contextMessages.length === 0) {
      const recentMessages = await ConversationService.getRecentMessages(
        conversationId,
        userId,
        30
      );
      const systemPrompt =
        typeof resolvedParameters.systemPrompt === 'string'
          ? resolvedParameters.systemPrompt
          : undefined;
      const maxContextTokens =
        typeof resolvedParameters.maxTokens === 'number'
          ? resolvedParameters.maxTokens
          : typeof resolvedParameters.maxOutputTokens === 'number'
            ? resolvedParameters.maxOutputTokens
            : undefined;

      const builtContext = ConversationContextManager.buildContext(
        recentMessages,
        systemPrompt,
        maxContextTokens
      );
      contextMessages = builtContext.messages;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    const chatService = AIServiceFactory.createChatService(resolvedProvider);

    const sendEvent = (payload: any) => {
      const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
      res.write(`data: ${data}\n\n`);
    };

    sendEvent({ type: 'start' });

    const aiResponse = await chatService.sendMessageWithContext(
      contextMessages,
      resolvedParameters
    );
    const content = aiResponse.content || '';

    if (content.length === 0) {
      sendEvent({ type: 'end' });
      sendEvent('[DONE]');
      res.end();
      return;
    }

    const chunkSize = 40;
    for (let index = 0; index < content.length; index += chunkSize) {
      const chunk = content.slice(index, index + chunkSize);
      sendEvent({ content: chunk });
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    sendEvent({ type: 'end' });
    sendEvent('[DONE]');
    res.end();
  } catch (error) {
    console.error('Stream conversation message error:', error);

    if (res.headersSent) {
      const message = error instanceof AIServiceError ? error.message : '串流傳輸發生錯誤';
      res.write(`data: ${JSON.stringify({ type: 'error', error: message })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    if (error instanceof AIServiceError) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          provider: error.provider,
        },
      });
      return;
    }

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CONVERSATION_NOT_FOUND',
          message: '對話不存在或無法訪問',
        },
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '串流取得回覆失敗',
      },
    });
  }
};
