import {
  ChatServiceInterface,
  ImageServiceInterface,
  VideoServiceInterface,
} from './interfaces/AIServiceInterface';
import { OpenAIChatService } from './providers/OpenAIChatService';
import { OpenAIImageService } from './providers/OpenAIImageService';
import { GeminiChatService } from './providers/GeminiChatService';

/**
 * AI服務工廠類
 */
export class AIServiceFactory {
  private static chatServices: Map<string, () => ChatServiceInterface> = new Map();
  private static imageServices: Map<string, () => ImageServiceInterface> = new Map();
  private static videoServices: Map<string, () => VideoServiceInterface> = new Map();

  /**
   * 初始化所有服務提供商
   */
  static initialize() {
    console.log('Initializing AI service providers...');

    // 註冊聊天服務
    this.registerChatService('openai', () => new OpenAIChatService());
    this.registerChatService('gemini', () => new GeminiChatService());

    // 註冊圖片生成服務
    this.registerImageService('openai', () => new OpenAIImageService());
    this.registerImageService('dall-e', () => new OpenAIImageService());

    // 註冊影片生成服務 (暫時為空，未來擴展)
    // this.registerVideoService('provider', () => new ProviderVideoService());

    console.log(`Registered ${this.chatServices.size} chat services`);
    console.log(`Registered ${this.imageServices.size} image services`);
    console.log(`Registered ${this.videoServices.size} video services`);
  }

  /**
   * 註冊聊天服務
   */
  static registerChatService(provider: string, factory: () => ChatServiceInterface) {
    this.chatServices.set(provider, factory);
  }

  /**
   * 註冊圖片生成服務
   */
  static registerImageService(provider: string, factory: () => ImageServiceInterface) {
    this.imageServices.set(provider, factory);
  }

  /**
   * 註冊影片生成服務
   */
  static registerVideoService(provider: string, factory: () => VideoServiceInterface) {
    this.videoServices.set(provider, factory);
  }

  /**
   * 創建聊天服務
   */
  static createChatService(provider: string): ChatServiceInterface {
    const factory = this.chatServices.get(provider);
    if (!factory) {
      throw new Error(`Chat service provider "${provider}" not found`);
    }
    return factory();
  }

  /**
   * 創建圖片生成服務
   */
  static createImageService(provider: string): ImageServiceInterface {
    const factory = this.imageServices.get(provider);
    if (!factory) {
      throw new Error(`Image service provider "${provider}" not found`);
    }
    return factory();
  }

  /**
   * 創建影片生成服務
   */
  static createVideoService(provider: string): VideoServiceInterface {
    const factory = this.videoServices.get(provider);
    if (!factory) {
      throw new Error(`Video service provider "${provider}" not found`);
    }
    return factory();
  }

  /**
   * 獲取所有可用的聊天服務提供商
   */
  static getAvailableChatProviders(): string[] {
    return Array.from(this.chatServices.keys());
  }

  /**
   * 獲取所有可用的圖片生成服務提供商
   */
  static getAvailableImageProviders(): string[] {
    return Array.from(this.imageServices.keys());
  }

  /**
   * 獲取所有可用的影片生成服務提供商
   */
  static getAvailableVideoProviders(): string[] {
    return Array.from(this.videoServices.keys());
  }

  /**
   * 檢查服務提供商是否可用
   */
  static isProviderAvailable(provider: string, type: 'chat' | 'image' | 'video'): boolean {
    switch (type) {
      case 'chat':
        return this.chatServices.has(provider);
      case 'image':
        return this.imageServices.has(provider);
      case 'video':
        return this.videoServices.has(provider);
      default:
        return false;
    }
  }
}
