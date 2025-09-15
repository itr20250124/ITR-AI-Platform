import { GeminiChatService } from '../GeminiChatService';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock Google Generative AI
jest.mock('@google/generative-ai');
const MockedGoogleGenerativeAI = GoogleGenerativeAI as jest.MockedClass<typeof GoogleGenerativeAI>;

describe('GeminiChatService', () => {
  let service: GeminiChatService;
  let mockGenAI: jest.Mocked<GoogleGenerativeAI>;
  let mockModel: any;

  beforeEach(() => {
    // Set up environment variable
    process.env.GEMINI_API_KEY = 'test-api-key';
    
    // Create mock model
    mockModel = {
      generateContent: jest.fn(),
      generateContentStream: jest.fn(),
      startChat: jest.fn(),
    };

    // Create mock GoogleGenerativeAI instance
    mockGenAI = {
      getGenerativeModel: jest.fn().mockReturnValue(mockModel),
    } as any;

    MockedGoogleGenerativeAI.mockImplementation(() => mockGenAI);
    
    service = new GeminiChatService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  describe('sendMessage', () => {
    it('should send a message and return response', async () => {
      const mockResponse = {
        text: () => 'Hello! How can I help you today?',
        candidates: [{ content: { parts: [{ text: 'Hello! How can I help you today?' }] } }],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 10,
          totalTokenCount: 15,
        },
      };

      const mockResult = {
        response: mockResponse,
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await service.sendMessage('Hello');

      expect(result).toMatchObject({
        content: 'Hello! How can I help you today?',
        role: 'assistant',
        usage: {
          promptTokens: 5,
          completionTokens: 10,
          totalTokens: 15,
        },
        metadata: {
          model: 'gemini-pro',
          candidates: 1,
        },
      });

      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
          topP: 1,
          topK: 1,
        },
      });

      expect(mockModel.generateContent).toHaveBeenCalledWith('Hello');
    });

    it('should handle custom parameters', async () => {
      const mockResponse = {
        text: () => 'Response with custom params',
        candidates: [{}],
      };

      const mockResult = {
        response: mockResponse,
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      await service.sendMessage('Test', {
        model: 'gemini-pro-vision',
        temperature: 0.5,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 10,
      });

      expect(mockGenAI.getGenerativeModel).toHaveBeenCalledWith({
        model: 'gemini-pro-vision',
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1000,
          topP: 0.8,
          topK: 10,
        },
      });
    });

    it('should throw error when no response from Gemini', async () => {
      const mockResponse = {
        text: () => '',
      };

      const mockResult = {
        response: mockResponse,
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      await expect(service.sendMessage('Hello')).rejects.toThrow(
        'No response from Gemini'
      );
    });
  });

  describe('sendMessageWithContext', () => {
    it('should send messages with context', async () => {
      const mockResponse = {
        text: () => 'Response with context',
        candidates: [{}],
      };

      const mockResult = {
        response: mockResponse,
      };

      const mockChat = {
        sendMessage: jest.fn().mockResolvedValue(mockResult),
      };

      mockModel.startChat.mockReturnValue(mockChat);

      const messages = [
        { role: 'system' as const, content: 'You are a helpful assistant' },
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
        { role: 'user' as const, content: 'How are you?' },
      ];

      const result = await service.sendMessageWithContext(messages);

      expect(result.content).toBe('Response with context');
      
      // Check that system messages are filtered out and roles are converted
      expect(mockModel.startChat).toHaveBeenCalledWith({
        history: [
          { role: 'user', parts: [{ text: 'Hello' }] },
          { role: 'model', parts: [{ text: 'Hi there!' }] },
        ],
      });

      expect(mockChat.sendMessage).toHaveBeenCalledWith('How are you?');
    });

    it('should filter out system messages', async () => {
      const mockResponse = {
        text: () => 'Response',
        candidates: [{}],
      };

      const mockResult = {
        response: mockResponse,
      };

      const mockChat = {
        sendMessage: jest.fn().mockResolvedValue(mockResult),
      };

      mockModel.startChat.mockReturnValue(mockChat);

      const messages = [
        { role: 'system' as const, content: 'System message' },
        { role: 'user' as const, content: 'User message' },
      ];

      await service.sendMessageWithContext(messages);

      // System message should be filtered out
      expect(mockModel.startChat).toHaveBeenCalledWith({
        history: [],
      });
    });
  });

  describe('sendMessageStream', () => {
    it('should handle streaming responses', async () => {
      const mockChunks = [
        { text: () => 'Hello' },
        { text: () => ' there!' },
        { text: () => ' How can I help?' },
      ];

      const mockStream = {
        stream: (async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        })(),
      };

      mockModel.generateContentStream.mockResolvedValue(mockStream);

      const chunks: any[] = [];
      for await (const chunk of service.sendMessageStream('Hello')) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0].content).toBe('Hello');
      expect(chunks[1].content).toBe(' there!');
      expect(chunks[2].content).toBe(' How can I help?');
      
      // Check that all chunks have the same ID
      const responseId = chunks[0].id;
      expect(chunks.every(chunk => chunk.id === responseId)).toBe(true);
      
      // Check metadata
      expect(chunks[2].metadata?.fullContent).toBe('Hello there! How can I help?');
    });
  });

  describe('parameter validation', () => {
    it('should validate temperature parameter', async () => {
      await expect(
        service.sendMessage('Hello', { temperature: 2 })
      ).rejects.toThrow();
    });

    it('should validate maxOutputTokens parameter', async () => {
      await expect(
        service.sendMessage('Hello', { maxOutputTokens: 0 })
      ).rejects.toThrow();
    });

    it('should validate topP parameter', async () => {
      await expect(
        service.sendMessage('Hello', { topP: 2 })
      ).rejects.toThrow();
    });

    it('should validate topK parameter', async () => {
      await expect(
        service.sendMessage('Hello', { topK: 0 })
      ).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle API key invalid error', async () => {
      const apiError = new Error('API_KEY_INVALID');
      mockModel.generateContent.mockRejectedValue(apiError);

      await expect(service.sendMessage('Hello')).rejects.toMatchObject({
        provider: 'gemini',
        type: 'UNAUTHORIZED',
        message: 'Invalid Gemini API key',
      });
    });

    it('should handle quota exceeded error', async () => {
      const quotaError = new Error('QUOTA_EXCEEDED');
      mockModel.generateContent.mockRejectedValue(quotaError);

      await expect(service.sendMessage('Hello')).rejects.toMatchObject({
        provider: 'gemini',
        type: 'RATE_LIMIT_EXCEEDED',
        message: 'Gemini API quota exceeded',
      });
    });

    it('should handle safety filter error', async () => {
      const safetyError = new Error('SAFETY violation');
      mockModel.generateContent.mockRejectedValue(safetyError);

      await expect(service.sendMessage('Hello')).rejects.toMatchObject({
        provider: 'gemini',
        type: 'CONTENT_BLOCKED',
        message: 'Content blocked by Gemini safety filters',
      });
    });

    it('should handle model not found error', async () => {
      const modelError = new Error('MODEL_NOT_FOUND');
      mockModel.generateContent.mockRejectedValue(modelError);

      await expect(service.sendMessage('Hello')).rejects.toMatchObject({
        provider: 'gemini',
        type: 'BAD_REQUEST',
        message: 'Requested Gemini model not found',
      });
    });

    it('should handle general API errors', async () => {
      const apiError = new Error('General API Error');
      mockModel.generateContent.mockRejectedValue(apiError);

      await expect(service.sendMessage('Hello')).rejects.toThrow();
    });
  });

  describe('makeRequest', () => {
    it('should handle string input', async () => {
      const mockResponse = {
        text: () => 'Response',
        candidates: [{}],
      };

      const mockResult = {
        response: mockResponse,
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await service.makeRequest('Hello', {});
      expect(result.content).toBe('Response');
    });

    it('should handle array input', async () => {
      const mockResponse = {
        text: () => 'Context response',
        candidates: [{}],
      };

      const mockResult = {
        response: mockResponse,
      };

      const mockChat = {
        sendMessage: jest.fn().mockResolvedValue(mockResult),
      };

      mockModel.startChat.mockReturnValue(mockChat);

      const messages = [
        { role: 'user' as const, content: 'Hello' },
      ];

      const result = await service.makeRequest(messages, {});
      expect(result.content).toBe('Context response');
    });

    it('should throw error for invalid input', async () => {
      await expect(
        service.makeRequest({ invalid: 'input' }, {})
      ).rejects.toThrow('Invalid input format for Gemini chat service');
    });
  });

  describe('usage info extraction', () => {
    it('should extract usage info when available', async () => {
      const mockResponse = {
        text: () => 'Response',
        candidates: [{}],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
          totalTokenCount: 30,
        },
      };

      const mockResult = {
        response: mockResponse,
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await service.sendMessage('Hello');
      
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('should handle missing usage info', async () => {
      const mockResponse = {
        text: () => 'Response',
        candidates: [{}],
        // No usageMetadata
      };

      const mockResult = {
        response: mockResponse,
      };

      mockModel.generateContent.mockResolvedValue(mockResult);

      const result = await service.sendMessage('Hello');
      
      expect(result.usage).toBeUndefined();
    });
  });
});