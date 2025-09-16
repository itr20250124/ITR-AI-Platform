import { AIServiceInterface } from './interfaces/AIServiceInterface';
import { ParameterDefinition, AIServiceError } from '../../types';
import { AIConfigManager } from './AIConfigManager';
import { globalParameterService } from '../parameters/ParameterService';

/**
 * AI服務基礎抽象類
 */
export abstract class BaseAIService implements AIServiceInterface {
  public abstract provider: string;
  public abstract supportedParameters: ParameterDefinition[];

  protected apiKey: string;
  protected baseURL: string;

  constructor() {
    this.apiKey = this.getApiKey();
    this.baseURL = this.getBaseURL();
  }

  /**
   * 初始化服務（在子類構造函數中調用）
   */
  protected initializeService(): void {
    // 註冊參數定義到全域參數服務
    if (this.supportedParameters && this.supportedParameters.length > 0) {
      globalParameterService.registerProvider(this.provider, this.supportedParameters);
    }
  }

  /**
   * 獲取API密鑰
   */
  protected abstract getApiKey(): string;

  /**
   * 獲取基礎URL
   */
  protected abstract getBaseURL(): string;

  /**
   * 驗證API密鑰
   */
  protected validateApiKey(): void {
    if (!this.apiKey) {
      throw new AIServiceError(
        this.provider,
        'MISSING_API_KEY',
        `API key for ${this.provider} is not configured`
      );
    }
  }

  /**
   * 驗證參數
   */
  protected validateParameters(parameters: Record<string, any>): void {
    const validation = globalParameterService.validateParameters(this.provider, parameters, {
      validateDependencies: true,
      validateCustomRules: true,
    });

    if (!validation.isValid) {
      throw new AIServiceError(
        this.provider,
        'INVALID_PARAMETERS',
        `Invalid parameters: ${validation.errors.map(e => e.message).join(', ')}`
      );
    }
  }

  /**
   * 合併參數
   */
  protected mergeParameters(userParameters: Record<string, any>): Record<string, any> {
    return globalParameterService.mergeWithDefaults(this.provider, userParameters);
  }

  /**
   * 處理API錯誤
   */
  protected handleApiError(error: any): never {
    console.error(`${this.provider} API Error:`, error);

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          throw new AIServiceError(
            this.provider,
            'UNAUTHORIZED',
            'Invalid API key or unauthorized access'
          );
        case 429:
          throw new AIServiceError(
            this.provider,
            'RATE_LIMIT_EXCEEDED',
            'Rate limit exceeded. Please try again later.'
          );
        case 400:
          throw new AIServiceError(
            this.provider,
            'BAD_REQUEST',
            data?.error?.message || 'Bad request'
          );
        case 500:
          throw new AIServiceError(
            this.provider,
            'SERVER_ERROR',
            'AI service is temporarily unavailable'
          );
        default:
          throw new AIServiceError(
            this.provider,
            'API_ERROR',
            data?.error?.message || `API error: ${status}`
          );
      }
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new AIServiceError(
        this.provider,
        'CONNECTION_ERROR',
        'Unable to connect to AI service'
      );
    }

    throw new AIServiceError(
      this.provider,
      'UNKNOWN_ERROR',
      error.message || 'Unknown error occurred'
    );
  }

  /**
   * 創建請求頭
   */
  protected createHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    return `${this.provider}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 抽象方法：發送請求
   */
  public abstract makeRequest(input: any, parameters: any): Promise<any>;

  /**
   * 健康檢查
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('test', {});
      return true;
    } catch (error) {
      console.warn(`Health check failed for ${this.provider}:`, error);
      return false;
    }
  }
}
