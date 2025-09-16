import { AIServiceFactory } from '../AIServiceFactory';
import { GeminiChatService } from '../providers/GeminiChatService';

describe('Gemini Integration', () => {
  let factory: AIServiceFactory;

  beforeEach(() => {
    // Set up environment variables
    process.env.GEMINI_API_KEY = 'test-api-key';
    factory = new AIServiceFactory();
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('Service Factory Integration', () => {
    it('should create Gemini chat service', () => {
      const chatService = factory.createChatService('gemini');
      expect(chatService).toBeInstanceOf(GeminiChatService);
      expect(chatService.provider).toBe('gemini');
    });

    it('should list Gemini in available chat providers', () => {
      const providers = factory.getAvailableChatProviders();
      expect(providers).toContain('gemini');
    });

    it('should not list Gemini in image providers', () => {
      const providers = factory.getAvailableImageProviders();
      expect(providers).not.toContain('gemini');
    });
  });

  describe('Parameter Definitions', () => {
    it('should have correct Gemini chat parameters', () => {
      const chatService = factory.createChatService('gemini');
      const parameters = chatService.supportedParameters;

      expect(parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'model',
            type: 'select',
            defaultValue: 'gemini-pro',
            options: ['gemini-pro', 'gemini-pro-vision'],
          }),
          expect.objectContaining({
            key: 'temperature',
            type: 'number',
            defaultValue: 0.9,
            min: 0,
            max: 1,
          }),
          expect.objectContaining({
            key: 'maxOutputTokens',
            type: 'number',
            defaultValue: 2048,
            min: 1,
            max: 8192,
          }),
          expect.objectContaining({
            key: 'topP',
            type: 'number',
            defaultValue: 1,
            min: 0,
            max: 1,
          }),
          expect.objectContaining({
            key: 'topK',
            type: 'number',
            defaultValue: 1,
            min: 1,
            max: 40,
          }),
        ])
      );
    });
  });

  describe('Parameter Differences from OpenAI', () => {
    it('should have different default temperature than OpenAI', () => {
      const geminiService = factory.createChatService('gemini');
      const openaiService = factory.createChatService('openai');

      const geminiTempParam = geminiService.supportedParameters.find(
        p => p.key === 'temperature'
      );
      const openaiTempParam = openaiService.supportedParameters.find(
        p => p.key === 'temperature'
      );

      expect(geminiTempParam?.defaultValue).toBe(0.9);
      expect(openaiTempParam?.defaultValue).toBe(0.7);
    });

    it('should have different temperature range than OpenAI', () => {
      const geminiService = factory.createChatService('gemini');
      const openaiService = factory.createChatService('openai');

      const geminiTempParam = geminiService.supportedParameters.find(
        p => p.key === 'temperature'
      );
      const openaiTempParam = openaiService.supportedParameters.find(
        p => p.key === 'temperature'
      );

      expect(geminiTempParam?.max).toBe(1);
      expect(openaiTempParam?.max).toBe(2);
    });

    it('should have unique topK parameter', () => {
      const geminiService = factory.createChatService('gemini');
      const openaiService = factory.createChatService('openai');

      const geminiTopK = geminiService.supportedParameters.find(
        p => p.key === 'topK'
      );
      const openaiTopK = openaiService.supportedParameters.find(
        p => p.key === 'topK'
      );

      expect(geminiTopK).toBeDefined();
      expect(openaiTopK).toBeUndefined();
    });

    it('should have maxOutputTokens instead of maxTokens', () => {
      const geminiService = factory.createChatService('gemini');
      const openaiService = factory.createChatService('openai');

      const geminiMaxTokens = geminiService.supportedParameters.find(
        p => p.key === 'maxOutputTokens'
      );
      const openaiMaxTokens = openaiService.supportedParameters.find(
        p => p.key === 'maxTokens'
      );

      expect(geminiMaxTokens).toBeDefined();
      expect(openaiMaxTokens).toBeDefined();

      // Gemini should not have maxTokens parameter
      const geminiMaxTokensParam = geminiService.supportedParameters.find(
        p => p.key === 'maxTokens'
      );
      expect(geminiMaxTokensParam).toBeUndefined();
    });

    it('should not have frequency and presence penalty parameters', () => {
      const geminiService = factory.createChatService('gemini');

      const frequencyPenalty = geminiService.supportedParameters.find(
        p => p.key === 'frequencyPenalty'
      );
      const presencePenalty = geminiService.supportedParameters.find(
        p => p.key === 'presencePenalty'
      );

      expect(frequencyPenalty).toBeUndefined();
      expect(presencePenalty).toBeUndefined();
    });
  });

  describe('Model Options', () => {
    it('should support gemini-pro and gemini-pro-vision models', () => {
      const chatService = factory.createChatService('gemini');
      const modelParam = chatService.supportedParameters.find(
        p => p.key === 'model'
      );

      expect(modelParam?.options).toEqual(['gemini-pro', 'gemini-pro-vision']);
    });

    it('should default to gemini-pro model', () => {
      const chatService = factory.createChatService('gemini');
      const modelParam = chatService.supportedParameters.find(
        p => p.key === 'model'
      );

      expect(modelParam?.defaultValue).toBe('gemini-pro');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported video service', () => {
      expect(() => {
        factory.createVideoService('gemini');
      }).toThrow('Video service not found: gemini');
    });
  });

  describe('Service Comparison', () => {
    it('should have different parameter counts than OpenAI', () => {
      const geminiService = factory.createChatService('gemini');
      const openaiService = factory.createChatService('openai');

      expect(geminiService.supportedParameters.length).toBe(5);
      expect(openaiService.supportedParameters.length).toBe(6);
    });

    it('should have different provider names', () => {
      const geminiService = factory.createChatService('gemini');
      const openaiService = factory.createChatService('openai');

      expect(geminiService.provider).toBe('gemini');
      expect(openaiService.provider).toBe('openai');
    });
  });
});
