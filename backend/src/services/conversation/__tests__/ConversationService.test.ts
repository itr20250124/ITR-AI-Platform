import { ConversationService } from '../ConversationService';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client');
const MockedPrismaClient = PrismaClient as jest.MockedClass<typeof PrismaClient>;

describe('ConversationService', () => {
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    mockPrisma = {
      conversation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      message: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    } as any;

    // Replace the prisma instance in the service
    (ConversationService as any).prisma = mockPrisma;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should create a new conversation', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        title: 'Test Conversation',
        aiProvider: 'openai',
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      mockPrisma.conversation.create.mockResolvedValue(mockConversation);

      const result = await ConversationService.createConversation({
        userId: 'user-1',
        title: 'Test Conversation',
        aiProvider: 'openai',
      });

      expect(result).toEqual(mockConversation);
      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          title: 'Test Conversation',
          aiProvider: 'openai',
          parameters: {},
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
    });

    it('should create conversation with custom parameters', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        title: 'Test Conversation',
        aiProvider: 'openai',
        parameters: { temperature: 0.8 },
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        user: {
          id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
        },
      };

      mockPrisma.conversation.create.mockResolvedValue(mockConversation);

      const result = await ConversationService.createConversation({
        userId: 'user-1',
        title: 'Test Conversation',
        aiProvider: 'openai',
        parameters: { temperature: 0.8 },
      });

      expect(result.parameters).toEqual({ temperature: 0.8 });
    });
  });

  describe('getUserConversations', () => {
    it('should get user conversations with default options', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          userId: 'user-1',
          title: 'Conversation 1',
          aiProvider: 'openai',
          parameters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
          user: { id: 'user-1', username: 'testuser', email: 'test@example.com' },
        },
      ];

      mockPrisma.conversation.findMany.mockResolvedValue(mockConversations);
      mockPrisma.conversation.count.mockResolvedValue(1);

      const result = await ConversationService.getUserConversations('user-1');

      expect(result.conversations).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
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
        take: 20,
        skip: 0,
      });
    });

    it('should get user conversations with custom options', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue([]);
      mockPrisma.conversation.count.mockResolvedValue(0);

      await ConversationService.getUserConversations('user-1', {
        limit: 10,
        offset: 5,
        orderBy: 'createdAt',
        order: 'asc',
      });

      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
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
        orderBy: { createdAt: 'asc' },
        take: 10,
        skip: 5,
      });
    });
  });

  describe('getConversationById', () => {
    it('should get conversation by id', async () => {
      const mockConversation = {
        id: 'conv-1',
        userId: 'user-1',
        title: 'Test Conversation',
        aiProvider: 'openai',
        parameters: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
        user: { id: 'user-1', username: 'testuser', email: 'test@example.com' },
      };

      mockPrisma.conversation.findFirst.mockResolvedValue(mockConversation);

      const result = await ConversationService.getConversationById('conv-1', 'user-1');

      expect(result).toEqual(mockConversation);
      expect(mockPrisma.conversation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'conv-1',
          userId: 'user-1',
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
    });

    it('should return null if conversation not found', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue(null);

      const result = await ConversationService.getConversationById('conv-1', 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('addMessage', () => {
    it('should add message to conversation', async () => {
      const mockConversation = { id: 'conv-1', userId: 'user-1' };
      const mockMessage = {
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
        metadata: {},
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation as any);
      mockPrisma.message.create.mockResolvedValue(mockMessage);
      mockPrisma.conversation.update.mockResolvedValue({} as any);

      const result = await ConversationService.addMessage({
        conversationId: 'conv-1',
        role: 'user',
        content: 'Hello',
      });

      expect(result).toEqual(mockMessage);
      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-1',
          role: 'user',
          content: 'Hello',
          metadata: {},
        },
      });
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { updatedAt: expect.any(Date) },
      });
    });

    it('should throw error if conversation not found', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      await expect(
        ConversationService.addMessage({
          conversationId: 'conv-1',
          role: 'user',
          content: 'Hello',
        })
      ).rejects.toThrow('Conversation not found');
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation successfully', async () => {
      mockPrisma.conversation.deleteMany.mockResolvedValue({ count: 1 });

      const result = await ConversationService.deleteConversation('conv-1', 'user-1');

      expect(result).toBe(true);
      expect(mockPrisma.conversation.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'conv-1',
          userId: 'user-1',
        },
      });
    });

    it('should return false if conversation not found', async () => {
      mockPrisma.conversation.deleteMany.mockResolvedValue({ count: 0 });

      const result = await ConversationService.deleteConversation('conv-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('searchConversations', () => {
    it('should search conversations by title and content', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          userId: 'user-1',
          title: 'AI Discussion',
          aiProvider: 'openai',
          parameters: {},
          createdAt: new Date(),
          updatedAt: new Date(),
          messages: [],
          user: { id: 'user-1', username: 'testuser', email: 'test@example.com' },
        },
      ];

      mockPrisma.conversation.findMany.mockResolvedValue(mockConversations);
      mockPrisma.conversation.count.mockResolvedValue(1);

      const result = await ConversationService.searchConversations('user-1', 'AI');

      expect(result.conversations).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          OR: [
            { title: { contains: 'AI', mode: 'insensitive' } },
            {
              messages: {
                some: {
                  content: { contains: 'AI', mode: 'insensitive' },
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
        take: 20,
        skip: 0,
      });
    });
  });

  describe('getConversationStats', () => {
    it('should get conversation statistics', async () => {
      mockPrisma.conversation.count.mockResolvedValue(5);
      mockPrisma.message.count.mockResolvedValue(25);
      mockPrisma.conversation.groupBy
        .mockResolvedValueOnce([
          { aiProvider: 'openai', _count: { id: 3 } },
          { aiProvider: 'gemini', _count: { id: 2 } },
        ])
        .mockResolvedValueOnce([
          { createdAt: new Date('2023-01-01'), _count: { id: 2 } },
          { createdAt: new Date('2023-01-02'), _count: { id: 3 } },
        ]);

      const result = await ConversationService.getConversationStats('user-1');

      expect(result.totalConversations).toBe(5);
      expect(result.totalMessages).toBe(25);
      expect(result.averageMessagesPerConversation).toBe(5);
      expect(result.providerUsage).toEqual({
        openai: 3,
        gemini: 2,
      });
      expect(result.recentActivity).toHaveLength(2);
    });
  });
});