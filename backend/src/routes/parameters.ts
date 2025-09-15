import { Router } from 'express';
import {
  getAvailableProviders,
  getProvidersByType,
  getProviderParameters,
  validateParameters,
  getParameterDefaults,
  getParameterPresets,
  createParameterPreset,
  getParameterStats,
  processParameters,
} from '../controllers/parameterController';
import { optionalAuth, authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/parameters/providers
 * @desc 獲取所有可用的AI服務提供商
 * @access Public
 */
router.get('/providers', optionalAuth, getAvailableProviders);

/**
 * @route GET /api/parameters/providers/:type
 * @desc 根據類型獲取服務提供商
 * @access Public
 */
router.get('/providers/:type', optionalAuth, getProvidersByType);

/**
 * @route GET /api/parameters/:provider/:type
 * @desc 獲取特定提供商的參數定義
 * @access Public
 */
router.get('/:provider/:type', optionalAuth, getProviderParameters);

/**
 * @route POST /api/parameters/:provider/:type/validate
 * @desc 驗證參數
 * @access Public
 */
router.post('/:provider/:type/validate', optionalAuth, validateParameters);

/**
 * @route GET /api/parameters/:provider/:type/defaults
 * @desc 獲取參數預設值
 * @access Public
 */
router.get('/:provider/:type/defaults', optionalAuth, getParameterDefaults);

/**
 * 獲取參數預設配置
 * @route GET /api/parameters/:provider/presets
 * @access Public
 */
router.get('/:provider/presets', optionalAuth, getParameterPresets);

/**
 * 創建自定義參數預設配置
 * @route POST /api/parameters/:provider/presets
 * @access Private
 */
router.post('/:provider/presets', authenticateToken, createParameterPreset);

/**
 * 獲取參數統計信息
 * @route GET /api/parameters/stats
 * @access Public
 */
router.get('/stats', optionalAuth, getParameterStats);

/**
 * 處理和驗證參數
 * @route POST /api/parameters/:provider/process
 * @access Public
 */
router.post('/:provider/process', optionalAuth, processParameters);

export default router;