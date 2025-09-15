import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { ServerConfig } from './types';
import apiRoutes from './routes';

// 載入環境變量
dotenv.config();

const app = express();

// 服務器配置
const config: ServerConfig = {
  port: parseInt(process.env.PORT || '5000'),
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
  },
};

// 中間件設置
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API路由
app.use('/api', apiRoutes);

// 404處理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '請求的端點不存在',
    },
  });
});

// 全域錯誤處理
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? '服務器內部錯誤' 
        : err.message,
    },
  });
});

// 啟動服務器
app.listen(config.port, () => {
  console.log(`🚀 服務器運行在 http://localhost:${config.port}`);
  console.log(`📝 API文檔: http://localhost:${config.port}/api`);
  console.log(`🏥 健康檢查: http://localhost:${config.port}/health`);
});

export default app;