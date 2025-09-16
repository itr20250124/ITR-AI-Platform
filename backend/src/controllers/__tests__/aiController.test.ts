import { Request, Response } from 'express';
import { 
  sendChatMessage, 
  sendChatMessageWithContext, 
  generateImage, 
  createImageVariation, 
  editImage 
} from '../aiController';
import { AIServiceFactory } from '../../services/ai/AIServiceFactory';
import { AIServiceError } from '../../types';

// Mock AI Service Factory
jest.mock('../../services/ai/AIServiceFactory');

describe('AI Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    
    mockRequest = {
      body: {},
      file: undefined,
      files: undefined,
    };
    
    mockResponse = {
      json: mockJson,
      status: mockStatus,
    };

    jest.clearAllMocks();
  });

  describe('sendChatMessage', () => {
    it('should send chat message successfully', async () => {
      // Arrange
      const mockChatService = {
        sendMessage: jest.fn().mockResolvedValue({
          id: 'test-id',
          content: 'Test response',
          role: 'assistant',
          timestamp: new Date(),
        }),
      };

      (AIServiceFactory.createChatService as jest.Mock).mockReturnValue(mockChatService);

      mockRequest.body = {
        message: 'Hello',
        provider: 'openai',
        parameters: { temperature: 0.7 },
      };

      // Act
      await sendChatMessage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(AIServiceFactory.createChatService).toHaveBeenCalledWith('openai');
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('Hello', { temperature: 0.7 });
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'test-id',
          content: 'Test response',
          role: 'assistant',
          timestamp: expect.any(Date),
        },
      });
    });

    it('should use default provider when not specified', async () => {
      // Arrange
      const mockChatService = {
        sendMessage: jest.fn().mockResolvedValue({
          id: 'test-id',
          content: 'Test response',
          role: 'assistant',
          timestamp: new Date(),
        }),
      };

      (AIServiceFactory.createChatService as jest.Mock).mockReturnValue(mockChatService);

      mockRequest.body = {
        message: 'Hello',
      };

      // Act
      await sendChatMessage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(AIServiceFactory.createChatService).toHaveBeenCalledWith('openai');
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('Hello', {});
    });

    it('should handle AIServiceError', async () => {
      // Arrange
      const mockChatService = {
        sendMessage: jest.fn().mockRejectedValue(
          new AIServiceError('openai', 'RATE_LIMIT', 'Rate limit exceeded')
        ),
      };

      (AIServiceFactory.createChatService as jest.Mock).mockReturnValue(mockChatService);

      mockRequest.body = {
        message: 'Hello',
        provider: 'openai',
      };

      // Act
      await sendChatMessage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
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
      const mockChatService = {
        sendMessage: jest.fn().mockRejectedValue(new Error('Generic error')),
      };

      (AIServiceFactory.createChatService as jest.Mock).mockReturnValue(mockChatService);

      mockRequest.body = {
        message: 'Hello',
        provider: 'openai',
      };

      // Act
      await sendChatMessage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    });
  });

  describe('sendChatMessageWithContext', () => {
    it('should send chat message with context successfully', async () => {
      // Arrange
      const mockChatService = {
        sendMessageWithContext: jest.fn().mockResolvedValue({
          id: 'test-id',
          content: 'Context response',
          role: 'assistant',
          timestamp: new Date(),
        }),
      };

      (AIServiceFactory.createChatService as jest.Mock).mockReturnValue(mockChatService);

      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];

      mockRequest.body = {
        messages,
        provider: 'gemini',
        parameters: { temperature: 0.5 },
      };

      // Act
      await sendChatMessageWithContext(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(AIServiceFactory.createChatService).toHaveBeenCalledWith('gemini');
      expect(mockChatService.sendMessageWithContext).toHaveBeenCalledWith(messages, { temperature: 0.5 });
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'test-id',
          content: 'Context response',
          role: 'assistant',
          timestamp: expect.any(Date),
        },
      });
    });

    it('should handle AIServiceError in context chat', async () => {
      // Arrange
      const mockChatService = {
        sendMessageWithContext: jest.fn().mockRejectedValue(
          new AIServiceError('gemini', 'CONTENT_BLOCKED', 'Content blocked by safety filters')
        ),
      };

      (AIServiceFactory.createChatService as jest.Mock).mockReturnValue(mockChatService);

      mockRequest.body = {
        messages: [{ role: 'user', content: 'Test' }],
        provider: 'gemini',
      };

      // Act
      await sendChatMessageWithContext(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CONTENT_BLOCKED',
          message: 'Content blocked by safety filters',
          provider: 'gemini',
        },
      });
    });
  });

  describe('generateImage', () => {
    it('should generate image successfully', async () => {
      // Arrange
      const mockImageService = {
        generateImage: jest.fn().mockResolvedValue({
          id: 'image-id',
          imageUrl: 'https://example.com/image.jpg',
          prompt: 'A beautiful sunset',
          status: 'completed',
          createdAt: new Date(),
        }),
      };

      (AIServiceFactory.createImageService as jest.Mock).mockReturnValue(mockImageService);

      mockRequest.body = {
        prompt: 'A beautiful sunset',
        provider: 'openai',
        parameters: { size: '1024x1024' },
      };

      // Act
      await generateImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(AIServiceFactory.createImageService).toHaveBeenCalledWith('openai');
      expect(mockImageService.generateImage).toHaveBeenCalledWith('A beautiful sunset', { size: '1024x1024' });
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'image-id',
          imageUrl: 'https://example.com/image.jpg',
          prompt: 'A beautiful sunset',
          status: 'completed',
          createdAt: expect.any(Date),
        },
      });
    });

    it('should handle image generation errors', async () => {
      // Arrange
      const mockImageService = {
        generateImage: jest.fn().mockRejectedValue(
          new AIServiceError('openai', 'INVALID_PROMPT', 'Invalid prompt provided')
        ),
      };

      (AIServiceFactory.createImageService as jest.Mock).mockReturnValue(mockImageService);

      mockRequest.body = {
        prompt: 'Invalid prompt',
        provider: 'openai',
      };

      // Act
      await generateImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_PROMPT',
          message: 'Invalid prompt provided',
          provider: 'openai',
        },
      });
    });
  });

  describe('createImageVariation', () => {
    it('should create image variation successfully', async () => {
      // Arrange
      const mockImageService = {
        createImageVariation: jest.fn().mockResolvedValue({
          id: 'variation-id',
          imageUrl: 'https://example.com/variation.jpg',
          status: 'completed',
          createdAt: new Date(),
        }),
      };

      (AIServiceFactory.createImageService as jest.Mock).mockReturnValue(mockImageService);

      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      };

      mockRequest.body = {
        provider: 'openai',
        parameters: { n: 2 },
      };
      mockRequest.file = mockFile as Express.Multer.File;

      // Act
      await createImageVariation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(AIServiceFactory.createImageService).toHaveBeenCalledWith('openai');
      expect(mockImageService.createImageVariation).toHaveBeenCalledWith(mockFile.buffer, { n: 2 });
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'variation-id',
          imageUrl: 'https://example.com/variation.jpg',
          status: 'completed',
          createdAt: expect.any(Date),
        },
      });
    });

    it('should handle missing file error', async () => {
      // Arrange
      mockRequest.body = {
        provider: 'openai',
        parameters: {},
      };
      mockRequest.file = undefined;

      // Act
      await createImageVariation(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'MISSING_FILE',
          message: 'Image file is required',
        },
      });
    });
  });

  describe('editImage', () => {
    it('should edit image successfully', async () => {
      // Arrange
      const mockImageService = {
        editImage: jest.fn().mockResolvedValue({
          id: 'edited-id',
          imageUrl: 'https://example.com/edited.jpg',
          prompt: 'Add a rainbow',
          status: 'completed',
          createdAt: new Date(),
        }),
      };

      (AIServiceFactory.createImageService as jest.Mock).mockReturnValue(mockImageService);

      const mockFiles = {
        image: [{
          buffer: Buffer.from('fake-image-data'),
          originalname: 'image.jpg',
          mimetype: 'image/jpeg',
          fieldname: 'image',
          encoding: '7bit',
          size: 1024,
          stream: {} as any,
          destination: '',
          filename: 'image.jpg',
          path: '',
        }],
        mask: [{
          buffer: Buffer.from('fake-mask-data'),
          originalname: 'mask.png',
          mimetype: 'image/png',
          fieldname: 'mask',
          encoding: '7bit',
          size: 512,
          stream: {} as any,
          destination: '',
          filename: 'mask.png',
          path: '',
        }],
      };

      mockRequest.body = {
        prompt: 'Add a rainbow',
        provider: 'openai',
        parameters: { size: '512x512' },
      };
      mockRequest.files = mockFiles;

      // Act
      await editImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(AIServiceFactory.createImageService).toHaveBeenCalledWith('openai');
      expect(mockImageService.editImage).toHaveBeenCalledWith(
        mockFiles.image[0].buffer,
        mockFiles.mask[0].buffer,
        'Add a rainbow',
        { size: '512x512' }
      );
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'edited-id',
          imageUrl: 'https://example.com/edited.jpg',
          prompt: 'Add a rainbow',
          status: 'completed',
          createdAt: expect.any(Date),
        },
      });
    });

    it('should handle missing files error', async () => {
      // Arrange
      mockRequest.body = {
        prompt: 'Add a rainbow',
        provider: 'openai',
      };
      mockRequest.files = {};

      // Act
      await editImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'MISSING_FILES',
          message: 'Both image and mask files are required',
        },
      });
    });

    it('should handle missing mask file error', async () => {
      // Arrange
      const mockFiles = {
        image: [{
          buffer: Buffer.from('fake-image-data'),
          originalname: 'image.jpg',
          mimetype: 'image/jpeg',
          fieldname: 'image',
          encoding: '7bit',
          size: 1024,
          stream: {} as any,
          destination: '',
          filename: 'image.jpg',
          path: '',
        }],
      };

      mockRequest.body = {
        prompt: 'Add a rainbow',
        provider: 'openai',
      };
      mockRequest.files = mockFiles;

      // Act
      await editImage(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: {
          type: 'MISSING_FILES',
          message: 'Both image and mask files are required',
        },
      });
    });
  });
});