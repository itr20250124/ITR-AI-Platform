import { GeminiChatService } from '../services/ai/providers/GeminiChatService';

// Mock Google Generative AI
jest.mock('@google/generative-ai');

describe('Gemini Services', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    jest.clearAllMocks();
  });

  describe('GeminiChatService', () => {
    test('should initialize with correct provider name', () => {
      const service = new GeminiChatService();
      expect(service.provider).toBe('gemini');
    });

    test('should have correct supported parameters', () => {
      const service = new GeminiChatService();
      const parameterKeys = service.supportedParameters.map(p => p.key);
      
      expect(parameterKeys).toContain('model');
      expect(parameterKeys).toContain('temperature');
      expect(parameterKeys).toContain('maxOutputTokens');
      expect(parameterKeys).toContain('topP');
      expect(parameterKeys).toContain('topK');
    });

    test('should throw error when API key is missing', () => {
      delete process.env.GEMINI_API_KEY;
      
      expect(() => {
        new GeminiChatService();
      }).toThrow('API key for gemini is not configured');
    });

    test('should validate parameters correctly', () => {
      const service = new GeminiChatService();
      
      // Valid parameters should not throw
      expect(() => {
        service['validateParameters']({
          temperature: 0.9,
          maxOutputTokens: 2048,
        });
      }).not.toThrow();

      // Invalid parameters should throw
      expect(() => {
        service['validateParameters']({
          temperature: 2, // Out of range
        });
      }).toThrow();
    });

    test('should convert messages to Gemini format correctly', () => {
      const service = new GeminiChatService();
      const messages = [
        { role: 'system' as const, content: 'You are a helpful assistant' },
        { role: 'user' as const, content: 'Hello' },
        { role: 'assistant' as const, content: 'Hi there!' },
      ];

      const converted = service['convertMessagesToGeminiFormat'](messages);
      
      // System messages should be filtered out
      expect(converted).toHaveLength(2);
      
      // Roles should be converted
      expect(converted[0].role).toBe('user');
      expect(converted[1].role).toBe('model');
      
      // Content should be in parts format
      expect(converted[0].parts[0].text).toBe('Hello');
      expect(converted[1].parts[0].text).toBe('Hi there!');
    });
  });
});