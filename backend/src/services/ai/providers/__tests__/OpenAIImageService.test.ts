import { OpenAIImageService } from '../OpenAIImageService';

// Mock OpenAI
const mockGenerate = jest.fn();
const mockCreateVariation = jest.fn();
const mockEdit = jest.fn();

jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      images: {
        generate: mockGenerate,
        createVariation: mockCreateVariation,
        edit: mockEdit,
      },
    })),
  };
});

// Mock BaseAIService methods
jest.mock('../../BaseAIService', () => {
  return {
    BaseAIService: class MockBaseAIService {
      protected apiKey = 'test-key';
      protected baseURL = 'https://api.openai.com/v1';

      constructor() {}

      protected getApiKey() {
        return process.env.OPENAI_API_KEY || '';
      }
      protected getBaseURL() {
        return 'https://api.openai.com/v1';
      }
      protected validateApiKey() {
        if (!this.getApiKey()) {
          throw new Error('OpenAI API key is required');
        }
      }
      protected initializeService() {}
      protected validateParameters() {}
      protected mergeParameters(params: any) {
        return {
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid',
          n: 1,
          ...params,
        };
      }
      protected handleApiError(error: any) {
        const { AIServiceError } = require('../../../../types');
        throw new AIServiceError('openai', 'API_ERROR', error.message);
      }
      protected generateId() {
        return 'test-id-' + Date.now();
      }
    },
  };
});

const originalEnv = process.env;

describe('OpenAIImageService', () => {
  let service: OpenAIImageService;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: 'test-api-key',
    };

    // Reset mocks
    mockGenerate.mockReset();
    mockCreateVariation.mockReset();
    mockEdit.mockReset();

    service = new OpenAIImageService();
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
      expect(parameterKeys).toContain('size');
      expect(parameterKeys).toContain('quality');
      expect(parameterKeys).toContain('style');
      expect(parameterKeys).toContain('n');
    });

    it('should throw error if API key is missing', () => {
      process.env.OPENAI_API_KEY = '';

      expect(() => {
        new OpenAIImageService();
      }).toThrow();
    });
  });

  describe('generateImage', () => {
    it('should generate image successfully', async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/generated-image.jpg',
            revised_prompt: 'A beautiful sunset over the ocean',
          },
        ],
      };

      mockGenerate.mockResolvedValue(mockResponse);

      // Act
      const result = await service.generateImage('A beautiful sunset', {
        size: '1024x1024',
        quality: 'hd',
        n: 1,
      });

      // Assert
      expect(mockGenerate).toHaveBeenCalledWith({
        model: 'dall-e-3',
        prompt: 'A beautiful sunset',
        size: '1024x1024',
        quality: 'hd',
        style: 'vivid',
        n: 1,
        response_format: 'url',
      });

      expect(result).toMatchObject({
        imageUrl: 'https://example.com/generated-image.jpg',
        prompt: 'A beautiful sunset',
        status: 'completed',
        parameters: expect.objectContaining({
          size: '1024x1024',
          quality: 'hd',
        }),
      });
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should use default parameters when none provided', async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/default-image.jpg',
          },
        ],
      };

      mockGenerate.mockResolvedValue(mockResponse);

      // Act
      await service.generateImage('Test prompt');

      // Assert
      expect(mockGenerate).toHaveBeenCalledWith({
        model: 'dall-e-3',
        prompt: 'Test prompt',
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
        n: 1,
        response_format: 'url',
      });
    });

    it('should handle API errors', async () => {
      // Arrange
      const apiError = new Error('API Error');
      (apiError as any).response = {
        status: 400,
        data: {
          error: {
            type: 'invalid_request_error',
            message: 'Invalid prompt',
          },
        },
      };

      mockGenerate.mockRejectedValue(apiError);

      // Act & Assert
      await expect(service.generateImage('Invalid prompt')).rejects.toThrow('API Error');
    });

    it('should throw error when no images generated', async () => {
      // Arrange
      const mockResponse = {
        data: [],
      };

      mockGenerate.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateImage('Test')).rejects.toThrow(
        'No image data returned from OpenAI'
      );
    });

    it('should handle multiple images with DALL-E 2', async () => {
      // Arrange
      const mockResponse = {
        data: [
          { url: 'https://example.com/image1.jpg' },
          { url: 'https://example.com/image2.jpg' },
        ],
      };

      mockGenerate.mockResolvedValue(mockResponse);

      // Act - use DALL-E 2 which supports multiple images
      const result = await service.generateImage('Test', {
        model: 'dall-e-2',
        n: 2,
        size: '512x512',
      });

      // Assert
      expect(result.imageUrl).toBe('https://example.com/image1.jpg');
      expect(result.metadata?.additionalImages).toHaveLength(1);
      expect(result.metadata?.additionalImages[0]).toBe('https://example.com/image2.jpg');
    });
  });

  describe('createImageVariation', () => {
    it('should create image variation successfully', async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/variation.jpg',
          },
        ],
      };

      mockCreateVariation.mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake-image-data');

      // Act
      const result = await service.createImageVariation(imageBuffer, {
        size: '512x512',
        n: 1,
      });

      // Assert
      expect(mockCreateVariation).toHaveBeenCalledWith({
        image: expect.any(File),
        size: '512x512',
        n: 1,
        response_format: 'url',
      });

      expect(result).toMatchObject({
        imageUrl: 'https://example.com/variation.jpg',
        status: 'completed',
        parameters: expect.objectContaining({
          size: '512x512',
        }),
      });
    });

    it('should handle variation API errors', async () => {
      // Arrange
      const apiError = new Error('Invalid image format');
      mockCreateVariation.mockRejectedValue(apiError);

      const imageBuffer = Buffer.from('invalid-data');

      // Act & Assert
      await expect(service.createImageVariation(imageBuffer, {})).rejects.toThrow(
        'Invalid image format'
      );
    });
  });

  describe('editImage', () => {
    it('should edit image successfully', async () => {
      // Arrange
      const mockResponse = {
        data: [
          {
            url: 'https://example.com/edited-image.jpg',
            revised_prompt: 'Add a rainbow to the sky',
          },
        ],
      };

      mockEdit.mockResolvedValue(mockResponse);

      const imageBuffer = Buffer.from('fake-image-data');
      const maskBuffer = Buffer.from('fake-mask-data');

      // Act
      const result = await service.editImage(imageBuffer, maskBuffer, 'Add a rainbow', {
        size: '1024x1024',
        n: 1,
      });

      // Assert
      expect(mockEdit).toHaveBeenCalledWith({
        image: expect.any(File),
        mask: expect.any(File),
        prompt: 'Add a rainbow',
        size: '1024x1024',
        n: 1,
        response_format: 'url',
      });

      expect(result).toMatchObject({
        imageUrl: 'https://example.com/edited-image.jpg',
        prompt: 'Add a rainbow',
        status: 'completed',
        parameters: expect.objectContaining({
          size: '1024x1024',
        }),
      });
    });

    it('should handle edit API errors', async () => {
      // Arrange
      const apiError = new Error('Invalid mask');
      mockEdit.mockRejectedValue(apiError);

      const imageBuffer = Buffer.from('image-data');
      const maskBuffer = Buffer.from('invalid-mask');

      // Act & Assert
      await expect(service.editImage(imageBuffer, maskBuffer, 'Edit prompt', {})).rejects.toThrow(
        'Invalid mask'
      );
    });
  });

  describe('makeRequest', () => {
    it('should call generateImage for string input', async () => {
      // Arrange
      const generateImageSpy = jest.spyOn(service, 'generateImage').mockResolvedValue({
        id: 'test',
        imageUrl: 'https://example.com/test.jpg',
        prompt: 'test',
        parameters: {},
        status: 'completed',
        createdAt: new Date(),
      });

      // Act
      await service.makeRequest('Test prompt', { size: '512x512' });

      // Assert
      expect(generateImageSpy).toHaveBeenCalledWith('Test prompt', {
        size: '512x512',
      });
    });

    it('should throw error for invalid input format', async () => {
      // Act & Assert
      await expect(service.makeRequest(123, {})).rejects.toThrow(
        'Invalid input format for OpenAI image service'
      );
    });
  });

  describe('parameter validation', () => {
    it('should validate size parameter for DALL-E 2', async () => {
      // Arrange
      const mockResponse = {
        data: [{ url: 'https://example.com/test.jpg' }],
      };
      mockGenerate.mockResolvedValue(mockResponse);

      // Act & Assert - DALL-E 2 supports these sizes
      await expect(
        service.generateImage('test', { model: 'dall-e-2', size: '256x256' })
      ).resolves.toBeDefined();
      await expect(
        service.generateImage('test', { model: 'dall-e-2', size: '512x512' })
      ).resolves.toBeDefined();
      await expect(
        service.generateImage('test', { model: 'dall-e-2', size: '1024x1024' })
      ).resolves.toBeDefined();
    });

    it('should validate quality parameter', async () => {
      // Arrange
      const mockResponse = {
        data: [{ url: 'https://example.com/test.jpg' }],
      };
      mockGenerate.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(service.generateImage('test', { quality: 'standard' })).resolves.toBeDefined();
      await expect(service.generateImage('test', { quality: 'hd' })).resolves.toBeDefined();
    });

    it('should validate n parameter for DALL-E 2', async () => {
      // Arrange
      const mockResponse = {
        data: [{ url: 'https://example.com/test1.jpg' }, { url: 'https://example.com/test2.jpg' }],
      };
      mockGenerate.mockResolvedValue(mockResponse);

      // Act & Assert - DALL-E 2 supports multiple images
      await expect(
        service.generateImage('test', {
          model: 'dall-e-2',
          n: 2,
          size: '512x512',
        })
      ).resolves.toBeDefined();
    });
  });
});
