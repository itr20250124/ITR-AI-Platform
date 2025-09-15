import { Router } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { AIServiceFactory } from '../../services/ai/AIServiceFactory';
import { authenticateToken } from '../../middleware/auth';
import { rateLimiter } from '../../middleware/rateLimiter';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const prisma = new PrismaClient();

// 配置multer用於文件上傳
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支援的圖片格式'));
    }
  },
});

// 圖片生成端點
router.post('/generate',
  authenticateToken,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 15分鐘內最多10次
  [
    body('prompt')
      .isString()
      .isLength({ min: 1, max: 1000 })
      .withMessage('提示詞必須是1-1000字符的字符串'),
    body('provider')
      .isString()
      .isIn(['openai'])
      .withMessage('不支援的AI服務提供商'),
    body('parameters')
      .optional()
      .isObject()
      .withMessage('參數必須是對象'),
  ],
  async (req, res) => {
    try {
      // 驗證輸入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '輸入驗證失敗',
          errors: errors.array(),
        });
      }

      const { prompt, provider, parameters = {} } = req.body;
      const userId = req.user?.id;

      // 獲取AI服務
      const aiService = AIServiceFactory.getService(provider);
      if (!aiService) {
        return res.status(400).json({
          success: false,
          message: '不支援的AI服務提供商',
        });
      }

      // 生成圖片
      const result = await aiService.generateImage({
        prompt,
        parameters,
      });

      // 保存到資料庫
      const generatedImage = await prisma.generatedImage.create({
        data: {
          id: uuidv4(),
          userId,
          prompt,
          provider,
          parameters: JSON.stringify(parameters),
          imageUrl: result.imageUrl,
          status: 'completed',
          metadata: JSON.stringify({
            model: parameters.model || 'dall-e-3',
            size: parameters.size || '1024x1024',
            quality: parameters.quality || 'standard',
            style: parameters.style || 'vivid',
            revisedPrompt: result.revisedPrompt,
            type: 'generation',
          }),
        },
      });

      res.json({
        success: true,
        data: {
          id: generatedImage.id,
          imageUrl: generatedImage.imageUrl,
          prompt: generatedImage.prompt,
          status: generatedImage.status,
          createdAt: generatedImage.createdAt,
          metadata: JSON.parse(generatedImage.metadata || '{}'),
        },
      });
    } catch (error) {
      console.error('圖片生成失敗:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '圖片生成失敗',
      });
    }
  }
);

// 圖片變體生成端點
router.post('/variation',
  authenticateToken,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 8 }), // 15分鐘內最多8次
  upload.single('image'),
  [
    body('provider')
      .isString()
      .isIn(['openai'])
      .withMessage('不支援的AI服務提供商'),
    body('parameters')
      .optional()
      .isObject()
      .withMessage('參數必須是對象'),
  ],
  async (req, res) => {
    try {
      // 驗證輸入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '輸入驗證失敗',
          errors: errors.array(),
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '請上傳圖片文件',
        });
      }

      const { provider, parameters = {} } = req.body;
      const userId = req.user?.id;

      // 獲取AI服務
      const aiService = AIServiceFactory.getService(provider);
      if (!aiService) {
        return res.status(400).json({
          success: false,
          message: '不支援的AI服務提供商',
        });
      }

      // 生成圖片變體
      const result = await aiService.createImageVariation({
        imageBuffer: req.file.buffer,
        parameters,
      });

      // 保存到資料庫
      const generatedImage = await prisma.generatedImage.create({
        data: {
          id: uuidv4(),
          userId,
          prompt: '圖片變體生成',
          provider,
          parameters: JSON.stringify(parameters),
          imageUrl: result.imageUrl,
          status: 'completed',
          metadata: JSON.stringify({
            size: parameters.size || '1024x1024',
            type: 'variation',
            originalFileName: req.file.originalname,
          }),
        },
      });

      res.json({
        success: true,
        data: {
          id: generatedImage.id,
          imageUrl: generatedImage.imageUrl,
          prompt: generatedImage.prompt,
          status: generatedImage.status,
          createdAt: generatedImage.createdAt,
          metadata: JSON.parse(generatedImage.metadata || '{}'),
        },
      });
    } catch (error) {
      console.error('圖片變體生成失敗:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '圖片變體生成失敗',
      });
    }
  }
);

// 圖片編輯端點
router.post('/edit',
  authenticateToken,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 6 }), // 15分鐘內最多6次
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mask', maxCount: 1 }
  ]),
  [
    body('prompt')
      .isString()
      .isLength({ min: 1, max: 1000 })
      .withMessage('編輯描述必須是1-1000字符的字符串'),
    body('provider')
      .isString()
      .isIn(['openai'])
      .withMessage('不支援的AI服務提供商'),
    body('parameters')
      .optional()
      .isObject()
      .withMessage('參數必須是對象'),
  ],
  async (req, res) => {
    try {
      // 驗證輸入
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '輸入驗證失敗',
          errors: errors.array(),
        });
      }

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.image || !files.image[0]) {
        return res.status(400).json({
          success: false,
          message: '請上傳原始圖片',
        });
      }

      if (!files.mask || !files.mask[0]) {
        return res.status(400).json({
          success: false,
          message: '請上傳遮罩圖片',
        });
      }

      const { prompt, provider, parameters = {} } = req.body;
      const userId = req.user?.id;

      // 獲取AI服務
      const aiService = AIServiceFactory.getService(provider);
      if (!aiService) {
        return res.status(400).json({
          success: false,
          message: '不支援的AI服務提供商',
        });
      }

      // 編輯圖片
      const result = await aiService.editImage({
        imageBuffer: files.image[0].buffer,
        maskBuffer: files.mask[0].buffer,
        prompt,
        parameters,
      });

      // 保存到資料庫
      const generatedImage = await prisma.generatedImage.create({
        data: {
          id: uuidv4(),
          userId,
          prompt,
          provider,
          parameters: JSON.stringify(parameters),
          imageUrl: result.imageUrl,
          status: 'completed',
          metadata: JSON.stringify({
            size: parameters.size || '1024x1024',
            type: 'edit',
            originalFileName: files.image[0].originalname,
            maskFileName: files.mask[0].originalname,
          }),
        },
      });

      res.json({
        success: true,
        data: {
          id: generatedImage.id,
          imageUrl: generatedImage.imageUrl,
          prompt: generatedImage.prompt,
          status: generatedImage.status,
          createdAt: generatedImage.createdAt,
          metadata: JSON.parse(generatedImage.metadata || '{}'),
        },
      });
    } catch (error) {
      console.error('圖片編輯失敗:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '圖片編輯失敗',
      });
    }
  }
);

// 獲取圖片歷史端點
router.get('/history',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { limit = 12, offset = 0, type } = req.query;

      const where: any = { userId };
      
      if (type && type !== 'all') {
        where.metadata = {
          contains: `"type":"${type}"`,
        };
      }

      const [images, total] = await Promise.all([
        prisma.generatedImage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: parseInt(limit as string),
          skip: parseInt(offset as string),
        }),
        prisma.generatedImage.count({ where }),
      ]);

      const formattedImages = images.map(image => ({
        id: image.id,
        imageUrl: image.imageUrl,
        prompt: image.prompt,
        status: image.status,
        createdAt: image.createdAt,
        metadata: JSON.parse(image.metadata || '{}'),
      }));

      res.json({
        success: true,
        data: {
          images: formattedImages,
          total,
        },
      });
    } catch (error) {
      console.error('獲取圖片歷史失敗:', error);
      res.status(500).json({
        success: false,
        message: '獲取圖片歷史失敗',
      });
    }
  }
);

// 刪除圖片端點
router.delete('/:imageId',
  authenticateToken,
  async (req, res) => {
    try {
      const { imageId } = req.params;
      const userId = req.user?.id;

      // 檢查圖片是否存在且屬於當前用戶
      const image = await prisma.generatedImage.findFirst({
        where: {
          id: imageId,
          userId,
        },
      });

      if (!image) {
        return res.status(404).json({
          success: false,
          message: '圖片不存在或無權限刪除',
        });
      }

      // 刪除圖片記錄
      await prisma.generatedImage.delete({
        where: { id: imageId },
      });

      res.json({
        success: true,
        message: '圖片已刪除',
      });
    } catch (error) {
      console.error('刪除圖片失敗:', error);
      res.status(500).json({
        success: false,
        message: '刪除圖片失敗',
      });
    }
  }
);

// 批量刪除圖片端點
router.delete('/batch',
  authenticateToken,
  [
    body('imageIds')
      .isArray({ min: 1 })
      .withMessage('圖片ID列表不能為空'),
    body('imageIds.*')
      .isString()
      .withMessage('圖片ID必須是字符串'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: '輸入驗證失敗',
          errors: errors.array(),
        });
      }

      const { imageIds } = req.body;
      const userId = req.user?.id;

      // 刪除屬於當前用戶的圖片
      const result = await prisma.generatedImage.deleteMany({
        where: {
          id: { in: imageIds },
          userId,
        },
      });

      res.json({
        success: true,
        message: `已刪除 ${result.count} 張圖片`,
        deletedCount: result.count,
      });
    } catch (error) {
      console.error('批量刪除圖片失敗:', error);
      res.status(500).json({
        success: false,
        message: '批量刪除圖片失敗',
      });
    }
  }
);

export default router;