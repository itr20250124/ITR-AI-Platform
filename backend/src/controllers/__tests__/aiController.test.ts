import { Request, Response } from 'express';
import { generateImage, createImageVariation, editImage } from '../aiController';
import { AIServiceFactory } from '../../services/ai/AIServiceFactory';
import { AIServiceError } from '../../types';

// Mock AIServiceFactory
jest.mock('../../services/ai/AIServiceFactory');
const mockAIServiceFactory = AIServiceFactory as jest.Mocked<typeof AIServiceFactory>;

// Mock console.error to avoid noise in tests
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('AI Controller - Image Functions', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockImageService: any;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    
    mockImageService = {
      generateImage: jest.fn(),
      createImageVariation: jest.fn(),
      editImage: jest.fn(),
    };

    mockAIServiceFactory.createImageService.mockReturnValue(mockImageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateImage', () => {
    it('should generate image successfully', async () => {
      // Arrange
      const mockImageResponse = {
        id: 'img-123',
        imageUrl: 'https://example.com/image.png',
        prompt: 'A beautiful sunset',
        parameters: { model: 'dall-e-3', size: '1024x1024' },
        status: 'completed',
        createdAt: new Date(),
      };

      mockRequest.body = {
        prompt: 'A beautiful sunset',
        provider: 'openai',
        parameters: { model: 'dall-e-3', size: '1024x1024' },
      };

      mockImageService.generateImage.mockResolvedValue(mockImageResponse);

      // Act
      await generateImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAIServiceFactory.createImageService).toHaveBeenCalledWith('openai');
      expect(mockImageService.generateImage).toHaveBeenCalledWith(
        'A beautiful sunset',
        { model: 'dall-e-3', size: '1024x1024' }
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockImageResponse,
      });
    });

    it('should use default provider when not specified', async () => {
      // Arrange
      mockRequest.body = {
        prompt: 'A beautiful sunset',
        parameters: {},
      };

      const mockImageResponse = {
        id: 'img-123',
        imageUrl: 'https://example.com/image.png',
        prompt: 'A beautiful sunset',
        parameters: {},
        status: 'completed',
        createdAt: new Date(),
      };

      mockImageService.generateImage.mockResolvedValue(mockImageResponse);

      // Act
      await generateImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockAIServiceFactory.createImageService).toHaveBeenCalledWith('openai');
    });

    it('should handle AIServiceError', async () => {
      // Arrange
      mockRequest.body = {
        prompt: 'A beautiful sunset',
        provider: 'openai',
      };

      const aiError = new AIServiceError('openai', 'RATE_LIMIT', 'Rate limit exceeded');
      mockImageService.generateImage.mockRejectedValue(aiError);

      // Act
      await generateImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RATE_LIMIT',
          message: 'Rate limit exceeded',
          provider: 'openai',
        },
      });
    });

    it('should handle generic errors', async () => {
      // Arrange
      mockRequest.body = {
        prompt: 'A beautiful sunset',
        provider: 'openai',
      };

      const genericError = new Error('Something went wrong');
      mockImageService.generateImage.mockRejectedValue(genericError);

      // Act
      await generateImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    });
  });

  describe('createImageVariation', () => {
    it('should create image variation successfully', async () => {
      // Arrange
      const mockBuffer = Buffer.from('fake image data');
      mockRequest.body = {
        provider: 'openai',
        parameters: { size: '1024x1024' },
      };
      mockRequest.file = {
        buffer: mockBuffer,
        originalname: 'test.png',
        mimetype: 'image/png',
      } as Express.Multer.File;

      const mockVariationResponse = {
        id: 'var-123',
        imageUrl: 'https://example.com/variation.png',
        prompt: 'Image variation',
        parameters: { size: '1024x1024' },
        status: 'completed',
        createdAt: new Date(),
      };

      mockImageService.createImageVariation.mockResolvedValue(mockVariationResponse);

      // Act
      await createImageVariation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockImageService.createImageVariation).toHaveBeenCalledWith(
        mockBuffer,
        { size: '1024x1024' }
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockVariationResponse,
      });
    });

    it('should return error when no file is provided', async () => {
      // Arrange
      mockRequest.body = {
        provider: 'openai',
        parameters: {},
      };
      mockRequest.file = undefined;

      // Act
      await createImageVariation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'MISSING_FILE',
          message: 'Image file is required',
        },
      });
    });

    it('should handle AIServiceError in variation', async () => {
      // Arrange
      const mockBuffer = Buffer.from('fake image data');
      mockRequest.body = { provider: 'openai' };
      mockRequest.file = {
        buffer: mockBuffer,
        originalname: 'test.png',
        mimetype: 'image/png',
      } as Express.Multer.File;

      const aiError = new AIServiceError('openai', 'INVALID_IMAGE', 'Invalid image format');
      mockImageService.createImageVariation.mockRejectedValue(aiError);

      // Act
      await createImageVariation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_IMAGE',
          message: 'Invalid image format',
          provider: 'openai',
        },
      });
    });
  });

  describe('editImage', () => {
    it('should edit image successfully', async () => {
      // Arrange
      const mockImageBuffer = Buffer.from('fake image data');
      const mockMaskBuffer = Buffer.from('fake mask data');
      
      mockRequest.body = {
        prompt: 'Add a rainbow',
        provider: 'openai',
        parameters: { size: '1024x1024' },
      };
      
      mockRequest.files = {
        image: [{
          buffer: mockImageBuffer,
          originalname: 'image.png',
          mimetype: 'image/png',
        }],
        mask: [{
          buffer: mockMaskBuffer,
          originalname: 'mask.png',
          mimetype: 'image/png',
        }],
      } as { [fieldname: string]: Express.Multer.File[] };

      const mockEditResponse = {
        id: 'edit-123',
        imageUrl: 'https://example.com/edited.png',
        prompt: 'Add a rainbow',
        parameters: { size: '1024x1024' },
        status: 'completed',
        createdAt: new Date(),
      };

      mockImageService.editImage.mockResolvedValue(mockEditResponse);

      // Act
      await editImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockImageService.editImage).toHaveBeenCalledWith(
        mockImageBuffer,
        mockMaskBuffer,
        'Add a rainbow',
        { size: '1024x1024' }
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockEditResponse,
      });
    });

    it('should return error when image file is missing', async () => {
      // Arrange
      mockRequest.body = {
        prompt: 'Add a rainbow',
        provider: 'openai',
      };
      
      mockRequest.files = {
        mask: [{
          buffer: Buffer.from('fake mask data'),
          originalname: 'mask.png',
          mimetype: 'image/png',
        }],
      } as { [fieldname: string]: Express.Multer.File[] };

      // Act
      await editImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'MISSING_FILES',
          message: 'Both image and mask files are required',
        },
      });
    });

    it('should return error when mask file is missing', async () => {
      // Arrange
      mockRequest.body = {
        prompt: 'Add a rainbow',
        provider: 'openai',
      };
      
      mockRequest.files = {
        image: [{
          buffer: Buffer.from('fake image data'),
          originalname: 'image.png',
          mimetype: 'image/png',
        }],
      } as { [fieldname: string]: Express.Multer.File[] };

      // Act
      await editImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'MISSING_FILES',
          message: 'Both image and mask files are required',
        },
      });
    });

    it('should handle AIServiceError in edit', async () => {
      // Arrange
      const mockImageBuffer = Buffer.from('fake image data');
      const mockMaskBuffer = Buffer.from('fake mask data');
      
      mockRequest.body = {
        prompt: 'Add a rainbow',
        provider: 'openai',
      };
      
      mockRequest.files = {
        image: [{ buffer: mockImageBuffer, originalname: 'image.png', mimetype: 'image/png' }],
        mask: [{ buffer: mockMaskBuffer, originalname: 'mask.png', mimetype: 'image/png' }],
      } as { [fieldname: string]: Express.Multer.File[] };

      const aiError = new AIServiceError('openai', 'INVALID_PROMPT', 'Prompt too long');
      mockImageService.editImage.mockRejectedValue(aiError);

      // Act
      await editImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_PROMPT',
          message: 'Prompt too long',
          provider: 'openai',
        },
      });
    });
  });
});