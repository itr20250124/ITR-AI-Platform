import { OpenAIChatService } from '../OpenAIChatService';
import { AIServiceError } from '../../../../types';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

// Mock environment variables
const originalEnv = process.env;

describe('OpenAIChatService', () => {
  let service: OpenAIChatService;
  let mockOpenAI: any;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: 'test-api-key',
    };

    // Get the mocked OpenAI constructor
    const OpenAI = require('openai').default;
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };
    OpenAI.mockImplementation(() => mockOpenAI);

    service = new OpenAIChatService();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct provider name', () => {
      expect(service.provider).toBe('openai');
    });

    it('should have supported parameters defined', () => {
      expect(service.supportedParameters).toBeDefined();
      expect(service.supportedParameters.length).toBeGreaterThan(0);
      
      const parameterKeys = service.supportedParameters.map(p => p.key);
      expect(parameterKeys).toContain('model');
      expect(parameterKeys).toContain('temperature');
      expect(parameterKeys).toContain('maxTokens');
    });

    it('should throw error if API key is missing', () => {
      process.env.OPENAI_API_KEY = '';
      
      expect(() => {
        new OpenAIChatService();
      }).toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: 'Hello! How can I help you today?',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.sendMessage('Hello', {
        temperature: 0.7,
        maxTokens: 100,
      });

      // Assert
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: 'Hello',
        }],
        temperature: 0.7,
        max_tokens: 100,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      expect(result).toMatchObject({
        content: 'Hello! How can I help you today?',
        role: 'assistant',
        usage: {
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25,
        },
      });
      expect(result.id).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should use default parameters when none provided', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: 'Response with defaults',
          },
          finish_reason: 'stop',
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      // Act
      await service.sendMessage('Test message');

      // Assert
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: 'Test message',
        }],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
    });

    it('should handle API errors', async () => {
      // Arrange
      const apiError = new Error('API Error');
      (apiError as any).response = {
        status: 429,
        data: {
          error: {
            type: 'rate_limit_exceeded',
            message: 'Rate limit exceeded',
          },
        },
      };

      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      // Act & Assert
      await expect(service.sendMessage('Hello')).rejects.toThrow(AIServiceError);
    });

    it('should throw error when no response from OpenAI', async () => {
      // Arrange
      const mockResponse = {
        choices: [],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.sendMessage('Hello')).rejects.toThrow('No response from OpenAI');
    });

    it('should include conversation ID in metadata', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: 'Response with conversation ID',
          },
          finish_reason: 'stop',
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      // Act
      const result = await service.sendMessage('Hello', {}, 'conv-123');

      // Assert
      expect(result.metadata?.conversationId).toBe('conv-123');
    });
  });

  describe('sendMessageWithContext', () => {
    it('should send message with context successfully', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: 'Response with context',
          },
          finish_reason: 'stop',
        }],
        usage: {
          prompt_tokens: 30,
          completion_tokens: 20,
          total_tokens: 50,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

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
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' },
        ],
        temperature: 0.5,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      expect(result).toMatchObject({
        content: 'Response with context',
        role: 'assistant',
        usage: {
          promptTokens: 30,
          completionTokens: 20,
          totalTokens: 50,
        },
      });
    });

    it('should handle system messages in context', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: {
            content: 'Response with system context',
          },
          finish_reason: 'stop',
        }],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'system' as const, content: 'You are a helpful assistant.' },
        { role: 'user' as const, content: 'Hello' },
      ];

      // Act
      await service.sendMessageWithContext(messages);

      // Assert
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Hello' },
          ],
        })
      );
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
        'Invalid input format for OpenAI chat service'
      );
    });
  });

  describe('parameter validation', () => {
    it('should validate temperature parameter', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: { content: 'test' },
          finish_reason: 'stop',
        }],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      // Act & Assert - should not throw for valid temperature
      await expect(service.sendMessage('test', { temperature: 1.5 })).resolves.toBeDefined();

      // Should handle invalid temperature gracefully (parameter validation in base class)
      await expect(service.sendMessage('test', { temperature: 3 })).resolves.toBeDefined();
    });

    it('should validate maxTokens parameter', async () => {
      // Arrange
      const mockResponse = {
        choices: [{
          message: { content: 'test' },
          finish_reason: 'stop',
        }],
      };
      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.sendMessage('test', { maxTokens: 2000 })).resolves.toBeDefined();
    });
  });
});