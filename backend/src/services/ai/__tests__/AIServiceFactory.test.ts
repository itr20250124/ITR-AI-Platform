import { AIServiceFactory } from '../AIServiceFactory';
import { OpenAIChatService } from '../providers/OpenAIChatService';
import { OpenAIImageService } from '../providers/OpenAIImageService';
import { GeminiChatService } from '../providers/GeminiChatService';

// Mock the service providers
jest.mock('../providers/OpenAIChatService');
jest.mock('../providers/OpenAIImageService');
jest.mock('../providers/GeminiChatService');

describe('AIServiceFactory', () => {
  beforeEach(() => {
    // Reset the factory state before each test
    (AIServiceFactory as any).chatServices = new Map();
    (AIServiceFactory as any).imageServices = new Map();
    (AIServiceFactory as any).videoServices = new Map();
    
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should register all available services', () => {
      // Act
      AIServiceFactory.initialize();

      // Assert
      expect(AIServiceFactory.getAvailableChatProviders()).toContain('openai');
      expect(AIServiceFactory.getAvailableChatProviders()).toContain('gemini');
      expect(AIServiceFactory.getAvailableImageProviders()).toContain('openai');
      expect(AIServiceFactory.getAvailableImageProviders()).toContain('dall-e');
    });

    it('should log initialization messages', () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      AIServiceFactory.initialize();

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Initializing AI service providers...');
      expect(consoleSpy).toHaveBeenCalledWith('Registered 2 chat services');
      expect(consoleSpy).toHaveBeenCalledWith('Registered 2 image services');
      expect(consoleSpy).toHaveBeenCalledWith('Registered 0 video services');

      consoleSpy.mockRestore();
    });
  });

  describe('createChatService', () => {
    beforeEach(() => {
      AIServiceFactory.initialize();
    });

    it('should create OpenAI chat service', () => {
      // Act
      const service = AIServiceFactory.createChatService('openai');

      // Assert
      expect(OpenAIChatService).toHaveBeenCalled();
      expect(service).toBeInstanceOf(OpenAIChatService);
    });

    it('should create Gemini chat service', () => {
      // Act
      const service = AIServiceFactory.createChatService('gemini');

      // Assert
      expect(GeminiChatService).toHaveBeenCalled();
      expect(service).toBeInstanceOf(GeminiChatService);
    });

    it('should throw error for unknown provider', () => {
      // Act & Assert
      expect(() => {
        AIServiceFactory.createChatService('unknown');
      }).toThrow('Chat service provider "unknown" not found');
    });
  });

  describe('createImageService', () => {
    beforeEach(() => {
      AIServiceFactory.initialize();
    });

    it('should create OpenAI image service', () => {
      // Act
      const service = AIServiceFactory.createImageService('openai');

      // Assert
      expect(OpenAIImageService).toHaveBeenCalled();
      expect(service).toBeInstanceOf(OpenAIImageService);
    });

    it('should create DALL-E image service (same as OpenAI)', () => {
      // Act
      const service = AIServiceFactory.createImageService('dall-e');

      // Assert
      expect(OpenAIImageService).toHaveBeenCalled();
      expect(service).toBeInstanceOf(OpenAIImageService);
    });

    it('should throw error for unknown provider', () => {
      // Act & Assert
      expect(() => {
        AIServiceFactory.createImageService('unknown');
      }).toThrow('Image service provider "unknown" not found');
    });
  });

  describe('createVideoService', () => {
    beforeEach(() => {
      AIServiceFactory.initialize();
    });

    it('should throw error for unknown provider (no video services registered)', () => {
      // Act & Assert
      expect(() => {
        AIServiceFactory.createVideoService('unknown');
      }).toThrow('Video service provider "unknown" not found');
    });
  });

  describe('registerChatService', () => {
    it('should register custom chat service', () => {
      // Arrange
      const mockService = { provider: 'custom' };
      const factory = () => mockService as any;

      // Act
      AIServiceFactory.registerChatService('custom', factory);

      // Assert
      expect(AIServiceFactory.getAvailableChatProviders()).toContain('custom');
      expect(AIServiceFactory.isProviderAvailable('custom', 'chat')).toBe(true);
    });
  });

  describe('registerImageService', () => {
    it('should register custom image service', () => {
      // Arrange
      const mockService = { provider: 'custom' };
      const factory = () => mockService as any;

      // Act
      AIServiceFactory.registerImageService('custom', factory);

      // Assert
      expect(AIServiceFactory.getAvailableImageProviders()).toContain('custom');
      expect(AIServiceFactory.isProviderAvailable('custom', 'image')).toBe(true);
    });
  });

  describe('registerVideoService', () => {
    it('should register custom video service', () => {
      // Arrange
      const mockService = { provider: 'custom' };
      const factory = () => mockService as any;

      // Act
      AIServiceFactory.registerVideoService('custom', factory);

      // Assert
      expect(AIServiceFactory.getAvailableVideoProviders()).toContain('custom');
      expect(AIServiceFactory.isProviderAvailable('custom', 'video')).toBe(true);
    });
  });

  describe('getAvailableProviders', () => {
    beforeEach(() => {
      AIServiceFactory.initialize();
    });

    it('should return available chat providers', () => {
      // Act
      const providers = AIServiceFactory.getAvailableChatProviders();

      // Assert
      expect(providers).toEqual(['openai', 'gemini']);
    });

    it('should return available image providers', () => {
      // Act
      const providers = AIServiceFactory.getAvailableImageProviders();

      // Assert
      expect(providers).toEqual(['openai', 'dall-e']);
    });

    it('should return empty array for video providers', () => {
      // Act
      const providers = AIServiceFactory.getAvailableVideoProviders();

      // Assert
      expect(providers).toEqual([]);
    });
  });

  describe('isProviderAvailable', () => {
    beforeEach(() => {
      AIServiceFactory.initialize();
    });

    it('should return true for available chat providers', () => {
      // Act & Assert
      expect(AIServiceFactory.isProviderAvailable('openai', 'chat')).toBe(true);
      expect(AIServiceFactory.isProviderAvailable('gemini', 'chat')).toBe(true);
    });

    it('should return true for available image providers', () => {
      // Act & Assert
      expect(AIServiceFactory.isProviderAvailable('openai', 'image')).toBe(true);
      expect(AIServiceFactory.isProviderAvailable('dall-e', 'image')).toBe(true);
    });

    it('should return false for unavailable providers', () => {
      // Act & Assert
      expect(AIServiceFactory.isProviderAvailable('unknown', 'chat')).toBe(false);
      expect(AIServiceFactory.isProviderAvailable('unknown', 'image')).toBe(false);
      expect(AIServiceFactory.isProviderAvailable('unknown', 'video')).toBe(false);
    });

    it('should return false for invalid service type', () => {
      // Act & Assert
      expect(AIServiceFactory.isProviderAvailable('openai', 'invalid' as any)).toBe(false);
    });
  });
});