import { OpenAIChatService } from '../services/ai/providers/OpenAIChatService';
import { OpenAIImageService } from '../services/ai/providers/OpenAIImageService';

// Mock OpenAI
jest.mock('openai');

describe('OpenAI Services', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    jest.clearAllMocks();
  });

  describe('OpenAIChatService', () => {
    test('should initialize with correct provider name', () => {
      const service = new OpenAIChatService();
      expect(service.provider).toBe('openai');
    });

    test('should have correct supported parameters', () => {
      const service = new OpenAIChatService();
      const parameterKeys = service.supportedParameters.map(p => p.key);
      
      expect(parameterKeys).toContain('model');
      expect(parameterKeys).toContain('temperature');
      expect(parameterKeys).toContain('maxTokens');
      expect(parameterKeys).toContain('topP');
      expect(parameterKeys).toContain('frequencyPenalty');
      expect(parameterKeys).toContain('presencePenalty');
    });

    test('should throw error when API key is missing', () => {
      delete process.env.OPENAI_API_KEY;
      
      expect(() => {
        new OpenAIChatService();
      }).toThrow('API key for openai is not configured');
    });

    test('should validate parameters correctly', () => {
      const service = new OpenAIChatService();
      
      // Valid parameters should not throw
      expect(() => {
        service['validateParameters']({
          temperature: 0.7,
          maxTokens: 1000,
        });
      }).not.toThrow();

      // Invalid parameters should throw
      expect(() => {
        service['validateParameters']({
          temperature: 3, // Out of range
        });
      }).toThrow();
    });
  });

  describe('OpenAIImageService', () => {
    test('should initialize with correct provider name', () => {
      const service = new OpenAIImageService();
      expect(service.provider).toBe('openai');
    });

    test('should have correct supported parameters', () => {
      const service = new OpenAIImageService();
      const parameterKeys = service.supportedParameters.map(p => p.key);
      
      expect(parameterKeys).toContain('model');
      expect(parameterKeys).toContain('size');
      expect(parameterKeys).toContain('quality');
      expect(parameterKeys).toContain('style');
      expect(parameterKeys).toContain('n');
    });

    test('should validate parameter combinations', () => {
      const service = new OpenAIImageService();
      
      // Valid DALL-E 3 parameters
      expect(() => {
        service['validateParameterCombination']({
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'hd',
          style: 'natural',
          n: 1,
        });
      }).not.toThrow();

      // Invalid DALL-E 3 parameters (n > 1)
      expect(() => {
        service['validateParameterCombination']({
          model: 'dall-e-3',
          n: 2,
        });
      }).toThrow('DALL-E 3 only supports generating 1 image at a time');

      // Invalid DALL-E 2 parameters (HD quality)
      expect(() => {
        service['validateParameterCombination']({
          model: 'dall-e-2',
          quality: 'hd',
        });
      }).toThrow('DALL-E 2 only supports standard quality');
    });
  });
});