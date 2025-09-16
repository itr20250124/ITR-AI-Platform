import { Router } from 'express';
import {
  createConversation,
  getUserConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
  addMessage,
  getConversationMessages,
  searchConversations,
  getConversationStats,
} from '../controllers/conversationController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import {
  createConversationSchema,
  updateConversationSchema,
  addMessageSchema,
} from '../middleware/validation/schemas/conversationSchemas';

const router = Router();

/**
 * 創建新對話
 * @route POST /api/conversations
 * @access Private
 */
router.post(
  '/',
  authenticateToken,
  validateBody(createConversationSchema),
  createConversation
);

/**
 * 獲取用戶的所有對話
 * @route GET /api/conversations
 * @access Private
 */
router.get('/', authenticateToken, getUserConversations);

/**
 * 搜索對話
 * @route GET /api/conversations/search
 * @access Private
 */
router.get('/search', authenticateToken, searchConversations);

/**
 * 獲取對話統計
 * @route GET /api/conversations/stats
 * @access Private
 */
router.get('/stats', authenticateToken, getConversationStats);

/**
 * 根據ID獲取對話詳情
 * @route GET /api/conversations/:conversationId
 * @access Private
 */
router.get('/:conversationId', authenticateToken, getConversationById);

/**
 * 更新對話
 * @route PUT /api/conversations/:conversationId
 * @access Private
 */
router.put(
  '/:conversationId',
  authenticateToken,
  validateBody(updateConversationSchema),
  updateConversation
);

/**
 * 刪除對話
 * @route DELETE /api/conversations/:conversationId
 * @access Private
 */
router.delete('/:conversationId', authenticateToken, deleteConversation);

/**
 * 添加訊息到對話
 * @route POST /api/conversations/:conversationId/messages
 * @access Private
 */
router.post(
  '/:conversationId/messages',
  authenticateToken,
  validateBody(addMessageSchema),
  addMessage
);

/**
 * 獲取對話的訊息歷史
 * @route GET /api/conversations/:conversationId/messages
 * @access Private
 */
router.get(
  '/:conversationId/messages',
  authenticateToken,
  getConversationMessages
);

export default router;
