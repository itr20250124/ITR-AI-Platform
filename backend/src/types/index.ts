// 後端特定類型定義
export * from '../../../shared/types';

import { Request, Response, NextFunction } from 'express';

// Express擴展類型
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface APIController {
  (req: AuthenticatedRequest, res: Response): Promise<void>;
}

// 服務層介面
export interface UserService {
  createUser(userData: CreateUserData): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<User>;
  deleteUser(userId: string): Promise<void>;
}

export interface ChatService {
  sendMessage(
    provider: string,
    message: string,
    parameters: ChatParameters,
    userId: string,
    conversationId?: string
  ): Promise<ChatResponse>;

  getConversationHistory(conversationId: string, userId: string): Promise<Message[]>;
  createConversation(userId: string, title: string, provider: string): Promise<Conversation>;
  deleteConversation(conversationId: string, userId: string): Promise<void>;
}

export interface ImageService {
  generateImage(
    provider: string,
    prompt: string,
    parameters: ImageParameters,
    userId: string
  ): Promise<ImageResponse>;

  getImageStatus(imageId: string, userId: string): Promise<GeneratedImage>;
  getUserImages(userId: string): Promise<GeneratedImage[]>;
  deleteImage(imageId: string, userId: string): Promise<void>;
}

export interface VideoService {
  generateVideo(
    provider: string,
    prompt: string,
    parameters: VideoParameters,
    userId: string
  ): Promise<VideoResponse>;

  getVideoStatus(videoId: string, userId: string): Promise<GeneratedVideo>;
  getUserVideos(userId: string): Promise<GeneratedVideo[]>;
  deleteVideo(videoId: string, userId: string): Promise<void>;
}

// 數據傳輸對象 (DTOs)
export interface CreateUserData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface SendMessageData {
  message: string;
  provider: string;
  parameters: ChatParameters;
  conversationId?: string;
}

export interface GenerateImageData {
  prompt: string;
  provider: string;
  parameters: ImageParameters;
}

export interface GenerateVideoData {
  prompt: string;
  provider: string;
  parameters: VideoParameters;
}

// 中間件類型
export interface AuthMiddleware {
  (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}

export interface ValidationMiddleware {
  (req: Request, res: Response, next: NextFunction): void;
}

export interface RateLimitMiddleware {
  (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}

// 配置類型
export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  ssl: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface ServerConfig {
  port: number;
  cors: {
    origin: string[];
    credentials: boolean;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
}

export interface AIProviderCredentials {
  openai: {
    apiKey: string;
    organization?: string;
  };
  gemini: {
    apiKey: string;
  };
}

// 錯誤處理類型
export interface ErrorHandler {
  handleAIServiceError(error: AIServiceError): Response;
  handleRateLimitError(error: RateLimitError): Response;
  handleValidationError(error: ValidationError): Response;
  handleGenericError(error: Error): Response;
}

// 工廠模式類型
export interface AIServiceFactory {
  createChatService(provider: string): ChatServiceInterface;
  createImageService(provider: string): ImageServiceInterface;
  createVideoService(provider: string): VideoServiceInterface;
}

import {
  User,
  UserPreferences,
  ChatParameters,
  ImageParameters,
  VideoParameters,
  ChatResponse,
  ImageResponse,
  VideoResponse,
  Message,
  Conversation,
  GeneratedImage,
  GeneratedVideo,
  AIServiceError,
  RateLimitError,
  ValidationError,
  ChatServiceInterface,
  ImageServiceInterface,
  VideoServiceInterface,
} from '../../../shared/types';
