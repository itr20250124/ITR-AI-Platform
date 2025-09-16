import request from 'supertest';
import express from 'express';

// Mock dependencies first
const mockPrisma = {
  generatedImage: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findFirst: jest.fn(),
  },
};

jest.mock('../../services/ai/AIServiceFactory');
jest.mock('../../middleware/auth');
jest.mock('../../middleware/rateLimiter', () => ({
  rateLimiter: () => (req: any, res: any, next: any) => next(),
}));
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

import { AIServiceFactory } from '../../services/ai/AIServiceFactory';
import { imageRoutes } from '../ai/image';
import { authenticateToken } from '../../middleware/auth';

const mockAIServiceFactory = AIServiceFactory as jest.Mocked<typeof AIServiceFactory>;
const mockAuthenticateToken = authenticateToken as jest.MockedFunction<typeof authenticateToken>;

describe('Image Routes Integration Tests', () => {
  let app: express.Application;
  let mockImageService: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/', imageRoutes); // 將路由掛在根路徑，方便測試使用完整路徑

    // Mock authentication middleware
    mockAuthenticateToken.mockImplementation((req: any, res, next) => {
      req.user = { id: 'user-123', email: 'test@example.com' };
      next();
      return undefined;
    });

    // Mock image service
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

  describe('POST /generate', () => {
    it('should generate image successfully', async () => {
      // Arrange
      const mockImageResponse = {
        imageUrl: 'https://example.com/generated.png',
        revisedPrompt: 'A beautiful sunset with enhanced details',
      };

      const mockDbResponse = {
        id: 'img-123',
        imageUrl: 'https://example.com/generated.png',
        prompt: 'A beautiful sunset',
        status: 'completed',
        createdAt: new Date(),
        metadata: JSON.stringify({
          model: 'dall-e-3',
          revisedPrompt: 'A beautiful sunset with enhanced details',
          type: 'generation',
        }),
      };

      mockImageService.generateImage.mockResolvedValue(mockImageResponse);
      mockPrisma.generatedImage.create.mockResolvedValue(mockDbResponse);

      // Act
      const response = await request(app)
        .post('/generate')
        .send({
          prompt: 'A beautiful sunset',
          provider: 'openai',
          parameters: {
            model: 'dall-e-3',
            size: '1024x1024',
          },
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('img-123');

      expect(mockImageService.generateImage).toHaveBeenCalledWith('A beautiful sunset', {
        model: 'dall-e-3',
        size: '1024x1024',
      });

      expect(mockPrisma.generatedImage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          prompt: 'A beautiful sunset',
          provider: 'openai',
          imageUrl: 'https://example.com/generated.png',
          status: 'completed',
        }),
      });
    });

    it('should return 400 for invalid prompt', async () => {
      // Act
      const response = await request(app).post('/generate').send({
        prompt: '', // Empty prompt
        provider: 'openai',
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('輸入驗證失敗');
    });

    it('should return 400 for unsupported provider', async () => {
      // Act
      const response = await request(app).post('/generate').send({
        prompt: 'A beautiful sunset',
        provider: 'unsupported-provider',
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle service errors', async () => {
      // Arrange
      mockImageService.generateImage.mockRejectedValue(new Error('Service unavailable'));

      // Act
      const response = await request(app).post('/generate').send({
        prompt: 'A beautiful sunset',
        provider: 'openai',
      });

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Service unavailable');
    });
  });

  describe('POST /variation', () => {
    it('should create image variation successfully', async () => {
      // Arrange
      const mockVariationResponse = {
        imageUrl: 'https://example.com/variation.png',
      };

      const mockDbResponse = {
        id: 'var-123',
        imageUrl: 'https://example.com/variation.png',
        prompt: '圖片變體生成',
        status: 'completed',
        createdAt: new Date(),
        metadata: JSON.stringify({
          type: 'variation',
          originalFileName: 'test.png',
        }),
      };

      mockImageService.createImageVariation.mockResolvedValue(mockVariationResponse);
      mockPrisma.generatedImage.create.mockResolvedValue(mockDbResponse);

      // Act
      const response = await request(app)
        .post('/variation')
        .attach('image', Buffer.from('fake image data'), 'test.png')
        .field('provider', 'openai')
        .field('parameters', '{"size":"1024x1024"}');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('var-123');
    });

    it('should return 400 when no image file provided', async () => {
      // Act
      const response = await request(app).post('/variation').send({
        provider: 'openai',
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('請上傳原始圖片');
    });
  });

  describe('POST /edit', () => {
    it('should edit image successfully', async () => {
      // Arrange
      const mockEditResponse = {
        imageUrl: 'https://example.com/edited.png',
      };

      const mockDbResponse = {
        id: 'edit-123',
        imageUrl: 'https://example.com/edited.png',
        prompt: 'Add a rainbow',
        status: 'completed',
        createdAt: new Date(),
        metadata: JSON.stringify({
          type: 'edit',
          originalFileName: 'image.png',
          maskFileName: 'mask.png',
        }),
      };

      mockImageService.editImage.mockResolvedValue(mockEditResponse);
      mockPrisma.generatedImage.create.mockResolvedValue(mockDbResponse);

      // Act
      const response = await request(app)
        .post('/edit')
        .attach('image', Buffer.from('fake image data'), 'image.png')
        .attach('mask', Buffer.from('fake mask data'), 'mask.png')
        .field('prompt', 'Add a rainbow')
        .field('provider', 'openai');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('edit-123');
    });

    it('should return 400 when image file is missing', async () => {
      // Act
      const response = await request(app)
        .post('/edit')
        .attach('mask', Buffer.from('fake mask data'), 'mask.png')
        .field('prompt', 'Add a rainbow')
        .field('provider', 'openai');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('請上傳原始圖片');
    });

    it('should return 400 when mask file is missing', async () => {
      // Act
      const response = await request(app)
        .post('/edit')
        .attach('image', Buffer.from('fake image data'), 'image.png')
        .field('prompt', 'Add a rainbow')
        .field('provider', 'openai');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('請上傳遮罩圖片');
    });
  });

  describe('GET /history', () => {
    it('should get image history successfully', async () => {
      // Arrange
      const mockImages = [
        {
          id: 'img-1',
          imageUrl: 'https://example.com/image1.png',
          prompt: 'First image',
          status: 'completed',
          createdAt: new Date(),
          metadata: JSON.stringify({ type: 'generation' }),
        },
        {
          id: 'img-2',
          imageUrl: 'https://example.com/image2.png',
          prompt: 'Second image',
          status: 'completed',
          createdAt: new Date(),
          metadata: JSON.stringify({ type: 'variation' }),
        },
      ];

      mockPrisma.generatedImage.findMany.mockResolvedValue(mockImages);
      mockPrisma.generatedImage.count.mockResolvedValue(2);

      // Act
      const response = await request(app).get('/history').query({ limit: 10, offset: 0 });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.images).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
    });

    it('should filter by type', async () => {
      // Arrange
      mockPrisma.generatedImage.findMany.mockResolvedValue([]);
      mockPrisma.generatedImage.count.mockResolvedValue(0);

      // Act
      const response = await request(app).get('/history').query({ type: 'generation' });

      // Assert
      expect(response.status).toBe(200);
      expect(mockPrisma.generatedImage.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          metadata: {
            contains: '"type":"generation"',
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
        skip: 0,
      });
    });
  });

  describe('DELETE /:imageId', () => {
    it('should delete image successfully', async () => {
      // Arrange
      const mockImage = {
        id: 'img-123',
        userId: 'user-123',
      };

      mockPrisma.generatedImage.findFirst.mockResolvedValue(mockImage);
      mockPrisma.generatedImage.delete.mockResolvedValue(mockImage);

      // Act
      const response = await request(app).delete('/img-123');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('圖片已刪除');
    });

    it('should return 404 for non-existent image', async () => {
      // Arrange
      mockPrisma.generatedImage.findFirst.mockResolvedValue(null);

      // Act
      const response = await request(app).delete('/non-existent');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('圖片不存在或無權刪除');
    });
  });

  describe('DELETE /batch', () => {
    it('should delete multiple images successfully', async () => {
      // Arrange
      mockPrisma.generatedImage.deleteMany.mockResolvedValue({ count: 3 });

      // Act
      const response = await request(app)
        .delete('/batch')
        .send({
          imageIds: ['img-1', 'img-2', 'img-3'],
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('已刪除 3 張圖片');
      expect(response.body.deletedCount).toBe(3);
    });

    it('should return 400 for empty image IDs array', async () => {
      // Act
      const response = await request(app).delete('/batch').send({
        imageIds: [],
      });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
