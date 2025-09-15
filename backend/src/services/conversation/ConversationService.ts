import { PrismaClient } from '@prisma/client';
import { Conversation, Message } from '../../types';

const prisma = new PrismaClient();

export interface CreateConversationData {
  userId: string;
  title: string;
  aiProvider: string;
  parameters?: Record<string, any>;
}

export interface CreateMessageData {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

export interface UpdateConversationData {
  title?: string;
  aiProvider?: string;
  parameters?: Record<string, any>;
}

export class ConversationService {
  /**
   * 創建新對話
   */
  static async createConversation(data: CreateConversationData): Promise<Conversation> {
    const conversation = await prisma.conversation.create({
      data: {
        userId: data.userId,
        title: data.title,
        aiProvider: data.aiProvider,
        parameters: data.parameters || {},
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return this.formatConversation(conversation);
  }

  /**
   * 獲取用戶的所有對話
   */
  static async getUserConversations(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      orderBy?: 'createdAt' | 'updatedAt';
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const {
      limit = 20,
      offset = 0,
      orderBy = 'updatedAt',
      order = 'desc',
    } = options;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1, // 只取最後一條訊息用於預覽
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { [orderBy]: order },
        take: limit,
        skip: offset,
      }),
      prisma.conversation.count({
        where: { userId },
      }),
    ]);

    return {
      conversations: conversations.map(this.formatConversation),
      total,
    };
  }

  /**
   * 根據ID獲取對話詳情
   */
  static async getConversationById(
    conversationId: string,
    userId: string
  ): Promise<Conversation | null> {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return conversation ? this.formatConversation(conversation) : null;
  }

  /**
   * 更新對話
   */
  static async updateConversation(
    conversationId: string,
    userId: string,
    data: UpdateConversationData
  ): Promise<Conversation | null> {
    const conversation = await prisma.conversation.updateMany({
      where: {
        id: conversationId,
        userId,
      },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.aiProvider && { aiProvider: data.aiProvider }),
        ...(data.parameters && { parameters: data.parameters }),
        updatedAt: new Date(),
      },
    });

    if (conversation.count === 0) {
      return null;
    }

    return this.getConversationById(conversationId, userId);
  }

  /**
   * 刪除對話
   */
  static async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    const result = await prisma.conversation.deleteMany({
      where: {
        id: conversationId,
        userId,
      },
    });

    return result.count > 0;
  }

  /**
   * 添加訊息到對話
   */
  static async addMessage(data: CreateMessageData): Promise<Message> {
    // 首先驗證對話是否存在
    const conversation = await prisma.conversation.findUnique({
      where: { id: data.conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const message = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        metadata: data.metadata || {},
      },
    });

    // 更新對話的最後更新時間
    await prisma.conversation.update({
      where: { id: data.conversationId },
      data: { updatedAt: new Date() },
    });

    return this.formatMessage(message);
  }

  /**
   * 獲取對話的訊息歷史
   */
  static async getConversationMessages(
    conversationId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      before?: Date;
      after?: Date;
    } = {}
  ): Promise<{ messages: Message[]; total: number }> {
    const { limit = 50, offset = 0, before, after } = options;

    // 驗證用戶是否有權限訪問此對話
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const whereClause: any = { conversationId };
    if (before) {
      whereClause.timestamp = { ...whereClause.timestamp, lt: before };
    }
    if (after) {
      whereClause.timestamp = { ...whereClause.timestamp, gt: after };
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        orderBy: { timestamp: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.message.count({
        where: whereClause,
      }),
    ]);

    return {
      messages: messages.map(this.formatMessage),
      total,
    };
  }

  /**
   * 搜索對話
   */
  static async searchConversations(
    userId: string,
    query: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ conversations: Conversation[]; total: number }> {
    const { limit = 20, offset = 0 } = options;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            {
              messages: {
                some: {
                  content: { contains: query, mode: 'insensitive' },
                },
              },
            },
          ],
        },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1,
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.conversation.count({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            {
              messages: {
                some: {
                  content: { contains: query, mode: 'insensitive' },
                },
              },
            },
          ],
        },
      }),
    ]);

    return {
      conversations: conversations.map(this.formatConversation),
      total,
    };
  }

  /**
   * 獲取對話統計
   */
  static async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
    providerUsage: Record<string, number>;
    recentActivity: Array<{ date: string; count: number }>;
  }> {
    const [
      totalConversations,
      totalMessages,
      providerStats,
      recentActivity,
    ] = await Promise.all([
      prisma.conversation.count({ where: { userId } }),
      prisma.message.count({
        where: {
          conversation: { userId },
        },
      }),
      prisma.conversation.groupBy({
        by: ['aiProvider'],
        where: { userId },
        _count: { id: true },
      }),
      prisma.conversation.groupBy({
        by: ['createdAt'],
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 最近30天
          },
        },
        _count: { id: true },
      }),
    ]);

    const providerUsage: Record<string, number> = {};
    providerStats.forEach(stat => {
      providerUsage[stat.aiProvider] = stat._count.id;
    });

    const activityMap = new Map<string, number>();
    recentActivity.forEach(activity => {
      const date = activity.createdAt.toISOString().split('T')[0];
      activityMap.set(date, (activityMap.get(date) || 0) + activity._count.id);
    });

    const recentActivityArray = Array.from(activityMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return {
      totalConversations,
      totalMessages,
      averageMessagesPerConversation: totalConversations > 0 
        ? Math.round(totalMessages / totalConversations * 100) / 100 
        : 0,
      providerUsage,
      recentActivity: recentActivityArray,
    };
  }

  /**
   * 格式化對話數據
   */
  private static formatConversation(conversation: any): Conversation {
    return {
      id: conversation.id,
      userId: conversation.userId,
      title: conversation.title,
      aiProvider: conversation.aiProvider,
      parameters: conversation.parameters,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages?.map(this.formatMessage) || [],
      user: conversation.user,
    };
  }

  /**
   * 格式化訊息數據
   */
  private static formatMessage(message: any): Message {
    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
      metadata: message.metadata,
    };
  }
}