import { AIServiceFactory } from '../AIServiceFactory';
import { OpenAIChatService } from '../providers/OpenAIChatService';
import { OpenAIImageService } from '../providers/OpenAIImageService';

describe('OpenAI Integration', () => {
  let factory: AIServiceFactory;

  beforeEach(() => {
    // Set up environment variables
    process.env.OPENAI_API_KEY = 'test-api-key';
    factory = new AIServiceFactory();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('Service Factory Integration', () => {
    it('should create OpenAI chat service', () => {
      const chatService = factory.createChatService('openai');
      expect(chatService).toBeInstanceOf(OpenAIChatService);
      expect(chatService.provider).toBe('openai');
    });

    it('should create Gemini chat service', () => {
      // Set up Gemini API key for this test
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const chatService = factory.createChatService('gemini');
      expect(chatService.provider).toBe('gemini');

      delete process.env.GEMINI_API_KEY;
    });

    it('should create OpenAI image service', () => {
      const imageService = factory.createImageService('openai');
      expect(imageService).toBeInstanceOf(OpenAIImageService);
      expect(imageService.provider).toBe('openai');
    });

    it('should create DALL-E image service (alias)', () => {
      const imageService = factory.createImageService('dall-e');
      expect(imageService).toBeInstanceOf(OpenAIImageService);
      expect(imageService.provider).toBe('openai');
    });

    it('should list available chat providers', () => {
      const providers = factory.getAvailableChatProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('gemini');
    });

    it('should list available image providers', () => {
      const providers = factory.getAvailableImageProviders();
      expect(providers).toContain('openai');
      expect(providers).toContain('dall-e');
    });
  });

  describe('Parameter Definitions', () => {
    it('should have correct chat parameters', () => {
      const chatService = factory.createChatService('openai');
      const parameters = chatService.supportedParameters;

      expect(parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'model',
            type: 'select',
            defaultValue: 'gpt-3.5-turbo',
          }),
          expect.objectContaining({
            key: 'temperature',
            type: 'number',
            min: 0,
            max: 2,
          }),
          expect.objectContaining({
            key: 'maxTokens',
            type: 'number',
            min: 1,
            max: 4000,
          }),
        ])
      );
    });

    it('should have correct image parameters', () => {
      const imageService = factory.createImageService('openai');
      const parameters = imageService.supportedParameters;

      expect(parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            key: 'model',
            type: 'select',
            defaultValue: 'dall-e-3',
            options: ['dall-e-2', 'dall-e-3'],
          }),
          expect.objectContaining({
            key: 'size',
            type: 'select',
            defaultValue: '1024x1024',
          }),
          expect.objectContaining({
            key: 'quality',
            type: 'select',
            defaultValue: 'standard',
            options: ['standard', 'hd'],
          }),
        ])
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported chat provider', () => {
      expect(() => {
        factory.createChatService('unsupported');
      }).toThrow('Chat service not found: unsupported');
    });

    it('should throw error for unsupported image provider', () => {
      expect(() => {
        factory.createImageService('unsupported');
      }).toThrow('Image service not found: unsupported');
    });
  });
});
