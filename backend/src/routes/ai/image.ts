import { Router, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

import { AIServiceFactory } from '../../services/ai/AIServiceFactory';
import { authenticateToken } from '../../middleware/auth';
import { rateLimiter } from '../../middleware/rateLimiter';
import { AuthenticatedRequest } from '../../types';

const prisma = new PrismaClient();

const { body, validationResult } = require('express-validator');

const imageRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('僅支援 JPG、PNG 或 WebP 圖片'));
    }
  },
});

const SUPPORTED_PROVIDERS = new Set(['openai']);

const parametersValidator = body('parameters')
  .optional()
  .custom((value: unknown) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          throw new Error();
        }
      } catch {
        throw new Error('參數格式必須為 JSON 物件');
      }
      return true;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('參數格式必須為物件');
    }

    return true;
  });

function parseParameters(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function sendValidationErrors(req: AuthenticatedRequest, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: '輸入驗證失敗',
      errors: errors.array(),
    });
    return true;
  }
  return false;
}

function ensureProvider(provider: string | undefined, res: Response) {
  const current = provider || 'openai';
  if (!SUPPORTED_PROVIDERS.has(current)) {
    res.status(400).json({
      success: false,
      message: '不支援的 AI 服務提供者',
    });
    return null;
  }
  return current;
}

function formatMetadata(record: { metadata: string | null }) {
  if (!record.metadata) {
    return {};
  }

  try {
    const parsed = JSON.parse(record.metadata);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function formatGeneratedImage(record: any) {
  return {
    id: record.id,
    imageUrl: record.imageUrl,
    prompt: record.prompt,
    status: record.status,
    createdAt: record.createdAt,
    metadata: formatMetadata(record),
  };
}

imageRoutes.post(
  '/generate',
  authenticateToken,
  rateLimiter(10, 15 * 60 * 1000),
  [
    body('prompt')
      .isString()
      .isLength({ min: 1, max: 1000 })
      .withMessage('提示文字長度必須介於 1 到 1000 字之間'),
    body('provider').optional().isString().withMessage('提供的 AI 服務不正確'),
    parametersValidator,
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    if (sendValidationErrors(req, res)) {
      return;
    }

    const { prompt, provider } = req.body;
    const resolvedProvider = ensureProvider(provider, res);
    if (!resolvedProvider) {
      return;
    }

    try {
      const parameters = parseParameters(req.body.parameters);
      const aiService = AIServiceFactory.createImageService(resolvedProvider);
      if (!aiService) {
        res.status(400).json({
          success: false,
          message: '不支援的 AI 服務提供者',
        });
        return;
      }

      const result = await aiService.generateImage(prompt, parameters);
      const metadata = {
        model: (parameters as any).model ?? 'dall-e-3',
        size: (parameters as any).size ?? '1024x1024',
        quality: (parameters as any).quality ?? 'standard',
        style: (parameters as any).style ?? 'vivid',
        revisedPrompt: (result as any).revisedPrompt,
        type: 'generation',
      };

      const record = await prisma.generatedImage.create({
        data: {
          id: randomUUID(),
          userId: req.user?.id ?? null,
          prompt,
          provider: resolvedProvider,
          parameters: JSON.stringify(parameters),
          imageUrl: result.imageUrl,
          status: 'completed',
          metadata: JSON.stringify(metadata),
        },
      });

      res.json({
        success: true,
        data: formatGeneratedImage(record),
      });
    } catch (error) {
      console.error('Generate image error:', error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : '圖片服務暫時無法提供',
      });
    }
  }
);

imageRoutes.post(
  '/variation',
  authenticateToken,
  rateLimiter(8, 15 * 60 * 1000),
  upload.single('image'),
  [
    body('provider').optional().isString().withMessage('提供的 AI 服務不正確'),
    parametersValidator,
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    if (sendValidationErrors(req, res)) {
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: '請上傳原始圖片',
      });
      return;
    }

    const resolvedProvider = ensureProvider(req.body.provider, res);
    if (!resolvedProvider) {
      return;
    }

    try {
      const parameters = parseParameters(req.body.parameters);
      const aiService = AIServiceFactory.createImageService(resolvedProvider);
      if (!aiService) {
        res.status(400).json({
          success: false,
          message: '不支援的 AI 服務提供者',
        });
        return;
      }

      const result = await aiService.createImageVariation(
        req.file.buffer,
        parameters
      );
      const metadata = {
        type: 'variation',
        originalFileName: req.file.originalname,
        options: parameters,
      };

      const record = await prisma.generatedImage.create({
        data: {
          id: randomUUID(),
          userId: req.user?.id ?? null,
          prompt: 'Image variation',
          provider: resolvedProvider,
          parameters: JSON.stringify(parameters),
          imageUrl: result.imageUrl,
          status: 'completed',
          metadata: JSON.stringify(metadata),
        },
      });

      res.json({
        success: true,
        data: formatGeneratedImage(record),
      });
    } catch (error) {
      console.error('Create variation error:', error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : '圖片服務暫時無法提供',
      });
    }
  }
);

imageRoutes.post(
  '/edit',
  authenticateToken,
  rateLimiter(6, 15 * 60 * 1000),
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mask', maxCount: 1 },
  ]),
  [
    body('prompt')
      .isString()
      .isLength({ min: 1, max: 1000 })
      .withMessage('提示文字長度必須介於 1 到 1000 字之間'),
    body('provider').optional().isString().withMessage('提供的 AI 服務不正確'),
    parametersValidator,
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    if (sendValidationErrors(req, res)) {
      return;
    }

    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const imageFile = files?.image?.[0];
    const maskFile = files?.mask?.[0];

    if (!imageFile) {
      res.status(400).json({
        success: false,
        message: '請上傳原始圖片',
      });
      return;
    }

    if (!maskFile) {
      res.status(400).json({
        success: false,
        message: '請上傳遮罩圖片',
      });
      return;
    }

    const resolvedProvider = ensureProvider(req.body.provider, res);
    if (!resolvedProvider) {
      return;
    }

    try {
      const parameters = parseParameters(req.body.parameters);
      const aiService = AIServiceFactory.createImageService(resolvedProvider);
      if (!aiService) {
        res.status(400).json({
          success: false,
          message: '不支援的 AI 服務提供者',
        });
        return;
      }

      const result = await aiService.editImage(
        imageFile.buffer,
        maskFile.buffer,
        req.body.prompt,
        parameters
      );

      const metadata = {
        type: 'edit',
        originalFileName: imageFile.originalname,
        maskFileName: maskFile.originalname,
        options: parameters,
      };

      const record = await prisma.generatedImage.create({
        data: {
          id: randomUUID(),
          userId: req.user?.id ?? null,
          prompt: req.body.prompt,
          provider: resolvedProvider,
          parameters: JSON.stringify(parameters),
          imageUrl: result.imageUrl,
          status: 'completed',
          metadata: JSON.stringify(metadata),
        },
      });

      res.json({
        success: true,
        data: formatGeneratedImage(record),
      });
    } catch (error) {
      console.error('Edit image error:', error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : '圖片服務暫時無法提供',
      });
    }
  }
);

imageRoutes.get(
  '/history',
  authenticateToken,
  rateLimiter(20, 15 * 60 * 1000),
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '未授權的請求',
      });
      return;
    }

    try {
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
      const offset = parseInt(req.query.offset as string, 10) || 0;
      const typeFilter = req.query.type as string | undefined;
      const statusFilter = req.query.status as string | undefined;

      const where: Record<string, unknown> = { userId };

      if (typeFilter) {
        where.metadata = {
          contains: `"type":"${typeFilter}"`,
        };
      }

      if (statusFilter) {
        where.status = statusFilter;
      }

      const [records, total] = await Promise.all([
        prisma.generatedImage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.generatedImage.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          images: records.map(formatGeneratedImage),
          total,
        },
      });
    } catch (error) {
      console.error('Fetch image history error:', error);
      res.status(500).json({
        success: false,
        message: '圖片歷史查詢失敗',
      });
    }
  }
);

imageRoutes.delete(
  '/batch',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const { imageIds } = req.body ?? {};
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      res.status(400).json({
        success: false,
        message: '請提供要刪除的圖片 ID 列表',
      });
      return;
    }

    try {
      const result = await prisma.generatedImage.deleteMany({
        where: {
          id: { in: imageIds },
          userId: req.user?.id ?? undefined,
        },
      });

      res.json({
        success: true,
        message: `已刪除 ${result.count} 張圖片`,
        deletedCount: result.count,
      });
    } catch (error) {
      console.error('Batch delete image error:', error);
      res.status(500).json({
        success: false,
        message: '圖片刪除失敗',
      });
    }
  }
);

imageRoutes.delete(
  '/:imageId',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    const { imageId } = req.params;

    try {
      const existing = await prisma.generatedImage.findFirst({
        where: {
          id: imageId,
          userId: req.user?.id ?? undefined,
        },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          message: '圖片不存在或無權刪除',
        });
        return;
      }

      await prisma.generatedImage.delete({
        where: { id: imageId },
      });

      res.json({
        success: true,
        message: '圖片已刪除',
      });
    } catch (error) {
      console.error('Delete image error:', error);
      res.status(500).json({
        success: false,
        message: '圖片刪除失敗',
      });
    }
  }
);

export { imageRoutes };
export default imageRoutes;
