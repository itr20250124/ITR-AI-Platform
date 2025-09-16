import { Router } from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updatePreferences,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import {
  validateBody,
  registerSchema,
  loginSchema,
  userPreferencesSchema,
} from '../middleware/validation';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc 用戶註冊
 * @access Public
 */
router.post('/register', validateBody(registerSchema), register);

/**
 * @route POST /api/auth/login
 * @desc 用戶登入
 * @access Public
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @route POST /api/auth/logout
 * @desc 用戶登出
 * @access Private
 */
router.post('/logout', authenticateToken, logout);

/**
 * @route GET /api/auth/profile
 * @desc 獲取當前用戶信息
 * @access Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route PUT /api/auth/preferences
 * @desc 更新用戶偏好設定
 * @access Private
 */
router.put(
  '/preferences',
  authenticateToken,
  validateBody(userPreferencesSchema),
  updatePreferences
);

export default router;
