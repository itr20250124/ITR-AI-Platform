import { OpenAIChatService } from '../OpenAIChatService';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('OpenAIChatService', () => {
  let service: OpenAIChatService;
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    // Set up environment variable
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    // Create mock OpenAI instance
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    } as any;

    MockedOpenAI.mockImplementation(() => mockOpenAI);
    
    service = new OpenAIChatService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  describe('sendMessage', () => {
    it('should send a message and return response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Hello! How can I help you?',
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25,
        },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const result = await service.sendMessage('Hello');

      expect(result).toMatchObject({
        content: 'Hello! How can I help you?',
        role: 'assistant',
        usage: {
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25,
        },
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
    });

    it('should handle custom parameters', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Response with custom params',
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      await service.sendMessage('Test', {
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 500,
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.5,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
    });

    it('should throw error when no response from OpenAI', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [],
      } as any);

      await expect(service.sendMessage('Hello')).rejects.toThrow(
        'No response from OpenAI'
      );
    });
  });

  describe('sendMessageWithContext', () => {
    it('should send messages with context', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Response with context',
              role: 'assistant',
            },
            finish_reason: 'stop',
          },
        ],
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse as any);

      const messages = [
        { role: 'system' as const, content: 'You are a helpful assistant' },
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
        { role: 'user' as const, content: 'How are you?' },
      ];

      const result = await service.sendMessageWithContext(messages);

      expect(result.content).toBe('Response with context');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
    });
  });

  describe('parameter validation', () => {
    it('should validate temperature parameter', async () => {
      await expect(
        service.sendMessage('Hello', { temperature: 3 })
      ).rejects.toThrow();
    });

    it('should validate maxTokens parameter', async () => {
      await expect(
        service.sendMessage('Hello', { maxTokens: 0 })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle API errors', async () => {
      const apiError = new Error('API Error');
      mockOpenAI.chat.completions.create.mockRejectedValue(apiError);

      await expect(service.sendMessage('Hello')).rejects.toThrow();
    });
  });
});