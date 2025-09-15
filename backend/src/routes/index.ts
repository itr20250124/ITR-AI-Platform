import { Router } from 'express';
import authRoutes from './auth';

const router = Router();

// 認證路由
router.use('/auth', authRoutes);

// API信息端點
router.get('/', (req, res) => {
  res.json({
    message: '多功能AI平台 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      chat: '/api/chat',
      image: '/api/image',
      video: '/api/video',
      user: '/api/user',
    },
  });
});

export default router;