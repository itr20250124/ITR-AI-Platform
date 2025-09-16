import { ParameterDefinition } from '../../../types';

/**
 * AI服務基礎介面
 */
export interface AIServiceInterface {
  provider: string;
  supportedParameters: ParameterDefinition[];
  makeRequest(input: any, parameters: any): Promise<any>;
}

/**
 * 聊天服務介面
 */
export interface ChatServiceInterface extends AIServiceInterface {
  sendMessage(
    message: string,
    parameters: ChatParameters,
    conversationId?: string
  ): Promise<ChatResponse>;

  sendMessageWithContext(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    parameters: ChatParameters
  ): Promise<ChatResponse>;
}

/**
 * 圖片生成服務介面
 */
export interface ImageServiceInterface extends AIServiceInterface {
  generateImage(prompt: string, parameters: ImageParameters): Promise<ImageResponse>;

  createImageVariation(imageBuffer: Buffer, parameters: ImageParameters): Promise<ImageResponse>;

  editImage(
    imageBuffer: Buffer,
    maskBuffer: Buffer,
    prompt: string,
    parameters: ImageParameters
  ): Promise<ImageResponse>;
}

/**
 * 影片生成服務介面
 */
export interface VideoServiceInterface extends AIServiceInterface {
  generateVideo(prompt: string, parameters: VideoParameters): Promise<VideoResponse>;
}

/**
 * 聊天參數
 */
export interface ChatParameters {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  model?: string;
  stream?: boolean;
}

/**
 * 圖片生成參數
 */
export interface ImageParameters {
  size?: string;
  quality?: string;
  style?: string;
  n?: number;
  model?: string;
}

/**
 * 影片生成參數
 */
export interface VideoParameters {
  duration?: number;
  fps?: number;
  resolution?: string;
  style?: string;
  model?: string;
}

/**
 * 聊天回應
 */
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
  metadata?: Record<string, any>;
}

/**
 * 圖片生成回應
 */
export interface ImageResponse {
  id: string;
  imageUrl: string;
  prompt: string;
  parameters: ImageParameters;
  status: 'completed' | 'failed';
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * 影片生成回應
 */
export interface VideoResponse {
  id: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  prompt: string;
  parameters: VideoParameters;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}
