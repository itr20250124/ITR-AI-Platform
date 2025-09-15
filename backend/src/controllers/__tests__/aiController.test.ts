import request from 'supertest';
import express from 'express';
import aiRoutes from '../../routes/ai';
import { AIServiceFactory } from '../../services/ai/AIServiceFactory';

// Mock the AI services
jest.mock('../../services/ai/AIServiceFactory');
const MockedAIServiceFactory = AIServiceFactory as jest.MockedClass<typeof AIServiceFactory>;

// Mock authentication middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id' };
    next();
  },
}));

describe('AI Controller', () => {
  let app: express.Application;
  let mockFactory: jest.Mocked<AIServiceFactory>;
  let mockChatService: any;
  let mockImageService: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/ai', aiRoutes);

    // Create mock services
    mockChatService = {
      sendMessage: jest.fn(),
      sendMessageWithContext: jest.fn(),
    };

    mockImageService = {
      generateImage: jest.fn(),
      createVariation: jest.fn(),
      editImage: jest.fn(),
    };

    // Create mock factory
    mockFactory = {
      createChatService: jest.fn().mockReturnValue(mockChatService),
      createImageService: jest.fn().mockReturnValue(mockImageService),
    } as any;

    MockedAIServiceFactory.mockImplementation(() => mockFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ai/chat', () => {
    it('should send chat message successfully with OpenAI', async () => {
      const mockResponse = {
        id: 'test-id',
        content: 'Hello! How can I help you?',
        role: 'assistant',
        timestamp: new Date(),
      };

      mockChatService.sendMessage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Hello',
          provider: 'openai',
          parameters: { temperature: 0.7 },
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockResponse,
      });

      expect(mockFactory.createChatService).toHaveBeenCalledWith('openai');
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'Hello',
        { temperature: 0.7 }
      );
    });

    it('should send chat message successfully with Gemini', async () => {
      const mockResponse = {
        id: 'test-id',
        content: 'Hello! How can I assist you today?',
        role: 'assistant',
        timestamp: new Date(),
      };

      mockChatService.sendMessage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Hello',
          provider: 'gemini',
          parameters: { 
            temperature: 0.9,
            maxOutputTokens: 2048,
            topK: 10 
          },
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockResponse,
      });

      expect(mockFactory.createChatService).toHaveBeenCalledWith('gemini');
      expect(mockChatService.sendMessage).toHaveBeenCalledWith(
        'Hello',
        { 
          temperature: 0.9,
          maxOutputTokens: 2048,
          topK: 10 
        }
      );
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          message: '', // Invalid empty message
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle AI service errors', async () => {
      const mockError = {
        name: 'AIServiceError',
        provider: 'openai',
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded',
      };

      mockChatService.sendMessage.mockRejectedValue(mockError);

      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Hello',
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          message: 'Rate limit exceeded',
          provider: 'openai',
        },
      });
    });
  });

  describe('POST /api/ai/chat/context', () => {
    it('should send chat message with context successfully', async () => {
      const mockResponse = {
        id: 'test-id',
        content: 'Based on our conversation...',
        role: 'assistant',
        timestamp: new Date(),
      };

      mockChatService.sendMessageWithContext.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];

      const response = await request(app)
        .post('/api/ai/chat/context')
        .send({
          messages,
          provider: 'openai',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockResponse,
      });

      expect(mockChatService.sendMessageWithContext).toHaveBeenCalledWith(
        messages,
        {}
      );
    });
  });

  describe('POST /api/ai/image/generate', () => {
    it('should generate image successfully', async () => {
      const mockResponse = {
        id: 'test-id',
        imageUrl: 'https://example.com/image.png',
        prompt: 'A beautiful sunset',
        status: 'completed',
        createdAt: new Date(),
      };

      mockImageService.generateImage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/ai/image/generate')
        .send({
          prompt: 'A beautiful sunset',
          provider: 'openai',
          parameters: { model: 'dall-e-3' },
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: mockResponse,
      });

      expect(mockFactory.createImageService).toHaveBeenCalledWith('openai');
      expect(mockImageService.generateImage).toHaveBeenCalledWith(
        'A beautiful sunset',
        { model: 'dall-e-3' }
      );
    });

    it('should handle validation errors for image generation', async () => {
      const response = await request(app)
        .post('/api/ai/image/generate')
        .send({
          prompt: '', // Invalid empty prompt
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle internal server errors', async () => {
      mockChatService.sendMessage.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Hello',
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        success: false,
        error: {
          type: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    });
  });
});