// 共享類型定義 - 前後端通用

// 用戶相關類型
export interface User {
  id: string;
  email: string;
  username: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  defaultAIProvider: string;
  defaultParameters: Record<string, any>;
  language: string;
}

// AI服務相關類型
export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'chat' | 'image' | 'video';
  apiEndpoint: string;
  apiKeyRequired: boolean;
  supportedParameters: ParameterDefinition[];
  rateLimits: RateLimit[];
}

export interface ParameterDefinition {
  key: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  defaultValue: any;
  min?: number;
  max?: number;
  options?: string[];
  description: string;
}

export interface RateLimit {
  requests: number;
  period: number; // in seconds
  burst?: number;
}

// 對話相關類型
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  aiProvider: string;
  parameters: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 生成內容相關類型
export interface GeneratedImage {
  id: string;
  userId: string;
  prompt: string;
  provider: string;
  parameters: Record<string, any>;
  imageUrl: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export interface GeneratedVideo {
  id: string;
  userId: string;
  prompt: string;
  provider: string;
  parameters: Record<string, any>;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
}

// API響應類型
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  message?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
}

// AI服務介面
export interface AIServiceInterface {
  provider: string;
  supportedParameters: ParameterDefinition[];
  makeRequest(input: any, parameters: any): Promise<any>;
}

export interface ChatServiceInterface extends AIServiceInterface {
  sendMessage(
    message: string,
    parameters: ChatParameters,
    conversationId?: string
  ): Promise<ChatResponse>;
}

export interface ImageServiceInterface extends AIServiceInterface {
  generateImage(
    prompt: string,
    parameters: ImageParameters
  ): Promise<ImageResponse>;
}

export interface VideoServiceInterface extends AIServiceInterface {
  generateVideo(
    prompt: string,
    parameters: VideoParameters
  ): Promise<VideoResponse>;
}

// 參數類型
export interface ChatParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  model?: string;
}

export interface ImageParameters {
  size?: string;
  quality?: string;
  style?: string;
  n?: number;
}

export interface VideoParameters {
  duration?: number;
  fps?: number;
  resolution?: string;
  style?: string;
}

// 響應類型
export interface ChatResponse {
  id: string;
  content: string;
  role: 'assistant';
  timestamp: Date;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ImageResponse {
  id: string;
  imageUrl: string;
  prompt: string;
  parameters: ImageParameters;
  status: 'completed' | 'failed';
  createdAt: Date;
}

export interface VideoResponse {
  id: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  prompt: string;
  parameters: VideoParameters;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
}

// 錯誤類型
export class AIServiceError extends Error {
  constructor(
    public provider: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

export class RateLimitError extends Error {
  constructor(
    public retryAfter: number,
    message: string
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}