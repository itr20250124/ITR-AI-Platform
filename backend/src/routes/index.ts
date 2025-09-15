import { Router } from 'express';
import authRoutes from './auth';
import parameterRoutes from './parameters';
import aiRoutes from './ai';

const router = Router();

// 認證路由
router.use('/auth', authRoutes);

// 參數路由
router.use('/parameters', parameterRoutes);

// AI服務路由
router.use('/ai', aiRoutes);

// API信息端點
router.get('/', (req, res) => {
  res.json({
    message: '多功能AI平台 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      parameters: '/api/parameters',
      chat: '/api/chat',
      image: '/api/image',
      video: '/api/video',
      user: '/api/user',
    },
  });
});

export default router;