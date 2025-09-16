import { GeminiChatService } from '../GeminiChatService';
import { AIServiceError } from '../../../../types';

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn(),
    })),
  };
});

const originalEnv = process.env;

describe('GeminiChatService', () => {
  let service: GeminiChatService;
  let mockGenAI: any;
  let mockModel: any;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'test-gemini-key',
    };

    mockModel = {
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
      startChat: jest.fn(),
    };

    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    };

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    GoogleGenerativeAI.mockImplementation(() => mockGenAI);

    service = new GeminiChatService();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct provider name', () => {
      expect(service.provider).toBe('gemini');
    });

    it('should have supported parameters defined', () => {
      expect(service.supportedParameters).toBeDefined();
      expect(service.supportedParameters.length).toBeGreaterThan(0);
      
      const parameterKeys = service.supportedParameters.map(p => p.key);
      expect(parameterKeys).toContain('model');
      expect(parameterKeys).toContain('temperature');
      expect(parameterKeys).toContain('maxOutputTokens');
      expect(parameterKeys).toContain('topP');
      expect(parameterKeys).toContain('topK');
    });

    it('should throw error if API key is missing', () => {
      process.env.GEMINI_API_KEY = '';
      
      expect(() => {
        new GeminiChatService();
      }).toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      // Arrange
      const mockResponse = {
        text: () => 'Hello! I am Gemini, how can I help you?',
        candidates: [{ content: 'test' }],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
          totalTokenCount: 15,
        },
      };

      mockModel.generateContent.mockResolvedValue({
        response: mockResponse,
      });

      // Act
      const result = await service.sendMessage('Hello', {
        temperature: 0.9,
        maxOutputTokens: 1024,
      });

      // Assert
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 1024,
          topP: 1,
          topK: 1,
        },
      });

      expect(mockModel.generateContent).toHaveBeenCalledWith('Hello');

      expect(result).toMatchObject({
        content: 'Hello! I am Gemini, how can I help you?',
        role: 'assistant',
        usage: {
          promptTokens: 5,
          completionTokens: 10,
          totalTokens: 15,
        },
      });
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should use default parameters when none provided', async () => {
      // Arrange
      const mockResponse = {
        text: () => 'Response with defaults',
        candidates: [{ content: 'test' }],
      };

      mockModel.generateContent.mockResolvedValue({
        response: mockResponse,
      });

      // Act
      await service.sendMessage('Test message');

      // Assert
      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
          topP: 1,
          topK: 1,
        },
      });
    });

    it('should handle API errors', async () => {
      // Arrange
      const apiError = new Error('API_KEY_INVALID');
      mockModel.generateContent.mockRejectedValue(apiError);

      // Act & Assert
      await expect(service.sendMessage('Hello')).rejects.toThrow(AIServiceError);
    });

    it('should throw error when no response from Gemini', async () => {
      // Arrange
      const mockResponse = {
        text: () => '',
      };

      mockModel.generateContent.mockResolvedValue({
        response: mockResponse,
      });

      // Act & Assert
      await expect(service.sendMessage('Hello')).rejects.toThrow('No response from Gemini');
    });

    it('should include conversation ID in metadata', async () => {
      // Arrange
      const mockResponse = {
        text: () => 'Response with conversation ID',
        candidates: [{ content: 'test' }],
      };

      mockModel.generateContent.mockResolvedValue({
        response: mockResponse,
      });

      // Act
      const result = await service.sendMessage('Hello', {}, 'conv-456');

      // Assert
      expect(result.metadata?.conversationId).toBe('conv-456');
    });
  });

  describe('sendMessageWithContext', () => {
    it('should send message with context successfully', async () => {
      // Arrange
      const mockChat = {
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Response with context',
            candidates: [{ content: 'test' }],
            usageMetadata: {
              promptTokenCount: 20,
              candidatesTokenCount: 15,
              totalTokenCount: 35,
            },
          },
        }),
      };

      mockModel.startChat.mockReturnValue(mockChat);

      const messages = [
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
        { role: 'user' as const, content: 'How are you?' },
      ];

      // Act
      const result = await service.sendMessageWithContext(messages, {
        temperature: 0.5,
      });

      // Assert
      expect(mockModel.startChat).toHaveBeenCalledWith({
        history: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
          {
            role: 'model',
            parts: [{ text: 'Hi there!' }],
          },
        ],
      });

      expect(mockChat.sendMessage).toHaveBeenCalledWith('How are you?');

      expect(result).toMatchObject({
        content: 'Response with context',
        role: 'assistant',
        usage: {
          promptTokens: 20,
          completionTokens: 15,
          totalTokens: 35,
        },
      });
    });

    it('should filter out system messages', async () => {
      // Arrange
      const mockChat = {
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Response without system messages',
            candidates: [{ content: 'test' }],
          },
        }),
      };

      mockModel.startChat.mockReturnValue(mockChat);

      const messages = [
        { role: 'system' as const, content: 'You are a helpful assistant.' },
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi!' },
        { role: 'user' as const, content: 'How are you?' },
      ];

      // Act
      await service.sendMessageWithContext(messages);

      // Assert
      expect(mockModel.startChat).toHaveBeenCalledWith({
        history: [
          {
            role: 'user',
            parts: [{ text: 'Hello' }],
          },
          {
            role: 'model',
            parts: [{ text: 'Hi!' }],
          },
        ],
      });
    });

    it('should handle empty context', async () => {
      // Arrange
      const mockChat = {
        sendMessage: jest.fn().mockResolvedValue({
          response: {
            text: () => 'Response to single message',
            candidates: [{ content: 'test' }],
          },
        }),
      };

      mockModel.startChat.mockReturnValue(mockChat);

      const messages = [
        { role: 'user' as const, content: 'Hello' },
      ];

      // Act
      await service.sendMessageWithContext(messages);

      // Assert
      expect(mockModel.startChat).toHaveBeenCalledWith({
        history: [],
      });
      expect(mockChat.sendMessage).toHaveBeenCalledWith('Hello');
    });
  });

  describe('makeRequest', () => {
    it('should call sendMessage for string input', async () => {
      // Arrange
      const sendMessageSpy = jest.spyOn(service, 'sendMessage').mockResolvedValue({
        id: 'test',
        content: 'response',
        role: 'assistant',
        timestamp: new Date(),
      });

      // Act
      await service.makeRequest('Hello', { temperature: 0.7 });

      // Assert
      expect(sendMessageSpy).toHaveBeenCalledWith('Hello', { temperature: 0.7 });
    });

    it('should call sendMessageWithContext for array input', async () => {
      // Arrange
      const sendMessageWithContextSpy = jest.spyOn(service, 'sendMessageWithContext').mockResolvedValue({
        id: 'test',
        content: 'response',
        role: 'assistant',
        timestamp: new Date(),
      });

      const messages = [{ role: 'user' as const, content: 'Hello' }];

      // Act
      await service.makeRequest(messages, { temperature: 0.7 });

      // Assert
      expect(sendMessageWithContextSpy).toHaveBeenCalledWith(messages, { temperature: 0.7 });
    });

    it('should throw error for invalid input format', async () => {
      // Act & Assert
      await expect(service.makeRequest({ invalid: 'input' }, {})).rejects.toThrow(
        'Invalid input format for Gemini chat service'
      );
    });
  });

  describe('error handling', () => {
    it('should handle API key invalid error', async () => {
      // Arrange
      const apiError = new Error('API_KEY_INVALID');
      mockModel.generateContent.mockRejectedValue(apiError);

      // Act & Assert
      await expect(service.sendMessage('Hello')).rejects.toThrow(AIServiceError);
      
      try {
        await service.sendMessage('Hello');
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect((error as AIServiceError).code).toBe('UNAUTHORIZED');
        expect((error as AIServiceError).provider).toBe('gemini');
      }
    });

    it('should handle quota exceeded error', async () => {
      // Arrange
      const apiError = new Error('QUOTA_EXCEEDED');
      mockModel.generateContent.mockRejectedValue(apiError);

      // Act & Assert
      try {
        await service.sendMessage('Hello');
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect((error as AIServiceError).code).toBe('RATE_LIMIT_EXCEEDED');
      }
    });

    it('should handle safety filter error', async () => {
      // Arrange
      const apiError = new Error('SAFETY violation detected');
      mockModel.generateContent.mockRejectedValue(apiError);

      // Act & Assert
      try {
        await service.sendMessage('Hello');
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect((error as AIServiceError).code).toBe('CONTENT_BLOCKED');
      }
    });

    it('should handle model not found error', async () => {
      // Arrange
      const apiError = new Error('MODEL_NOT_FOUND');
      mockModel.generateContent.mockRejectedValue(apiError);

      // Act & Assert
      try {
        await service.sendMessage('Hello');
      } catch (error) {
        expect(error).toBeInstanceOf(AIServiceError);
        expect((error as AIServiceError).code).toBe('BAD_REQUEST');
      }
    });
  });

  describe('parameter validation', () => {
    it('should validate temperature parameter', async () => {
      // Arrange
      const mockResponse = {
        text: () => 'test response',
        candidates: [{ content: 'test' }],
      };
      mockModel.generateContent.mockResolvedValue({ response: mockResponse });

      // Act & Assert - should not throw for valid temperature
      await expect(service.sendMessage('test', { temperature: 0.5 })).resolves.toBeDefined();
    });

    it('should validate maxOutputTokens parameter', async () => {
      // Arrange
      const mockResponse = {
        text: () => 'test response',
        candidates: [{ content: 'test' }],
      };
      mockModel.generateContent.mockResolvedValue({ response: mockResponse });

      // Act & Assert
      await expect(service.sendMessage('test', { maxOutputTokens: 4000 })).resolves.toBeDefined();
    });
  });
});