import { Router } from 'express';
import multer from 'multer';
import { 
  sendChatMessage,
  sendChatMessageWithContext,
  generateImage,
  createImageVariation,
  editImage
} from '../controllers/aiController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { 
  chatMessageSchema,
  chatContextSchema,
  imageGenerationSchema,
  imageVariationSchema,
  imageEditSchema
} from '../middleware/validation/schemas/aiSchemas';

// 配置multer用於文件上傳
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

/**
 * 發送聊天訊息
 * @route POST /api/ai/chat
 * @access Private
 */
router.post('/chat', authenticateToken, validateBody(chatMessageSchema), sendChatMessage);

/**
 * 發送帶上下文的聊天訊息
 * @route POST /api/ai/chat/context
 * @access Private
 */
router.post('/chat/context', authenticateToken, validateBody(chatContextSchema), sendChatMessageWithContext);

/**
 * 生成圖片
 * @route POST /api/ai/image/generate
 * @access Private
 */
router.post('/image/generate', authenticateToken, validateBody(imageGenerationSchema), generateImage);

/**
 * 創建圖片變體
 * @route POST /api/ai/image/variation
 * @access Private
 */
router.post('/image/variation', 
  authenticateToken, 
  upload.single('image'), 
  validateBody(imageVariationSchema), 
  createImageVariation
);

/**
 * 編輯圖片
 * @route POST /api/ai/image/edit
 * @access Private
 */
router.post('/image/edit', 
  authenticateToken, 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'mask', maxCount: 1 }
  ]), 
  validateBody(imageEditSchema), 
  editImage
);

export default router;