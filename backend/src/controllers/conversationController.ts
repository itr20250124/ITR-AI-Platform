import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { ConversationService } from '../services/conversation/ConversationService';

/**
 * 創建新對話
 */
export const createConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const getUserConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const getConversationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const updateConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    const conversation = await ConversationService.updateConversation(
      conversationId,
      userId,
      { title, aiProvider, parameters }
    );

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
export const deleteConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const getConversationMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const searchConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
export const getConversationStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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