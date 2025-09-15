import { AIServiceError, RateLimitError } from '../../../types';

export interface RetryConfig {
  maxRetries: number;
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffStrategy: 'exponential',
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  retryableErrors: [
    'RATE_LIMIT_EXCEEDED',
    'SERVER_ERROR',
    'CONNECTION_ERROR',
    'TIMEOUT',
  ],
};

/**
 * 重試處理器
 */
export class RetryHandler {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * 執行帶重試的操作
   */
  async execute<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // 檢查是否應該重試
        if (!this.shouldRetry(error as Error, attempt)) {
          throw error;
        }

        // 計算延遲時間
        const delay = this.calculateDelay(attempt);
        
        console.warn(
          `${context} failed (attempt ${attempt + 1}/${this.config.maxRetries + 1}), ` +
          `retrying in ${delay}ms:`,
          error
        );

        // 等待後重試
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  /**
   * 判斷是否應該重試
   */
  private shouldRetry(error: Error, attempt: number): boolean {
    // 已達到最大重試次數
    if (attempt >= this.config.maxRetries) {
      return false;
    }

    // 檢查錯誤類型
    if (error instanceof AIServiceError) {
      return this.config.retryableErrors.includes(error.code);
    }

    if (error instanceof RateLimitError) {
      return true;
    }

    // 檢查網路錯誤
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('ENOTFOUND') ||
        error.message.includes('timeout')) {
      return true;
    }

    return false;
  }

  /**
   * 計算延遲時間
   */
  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.backoffStrategy) {
      case 'exponential':
        delay = this.config.baseDelay * Math.pow(2, attempt);
        break;
      case 'linear':
        delay = this.config.baseDelay * (attempt + 1);
        break;
      case 'fixed':
      default:
        delay = this.config.baseDelay;
        break;
    }

    // 添加隨機抖動 (±25%)
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    delay += jitter;

    // 限制最大延遲
    return Math.min(delay, this.config.maxDelay);
  }

  /**
   * 睡眠函數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 創建預設重試處理器
 */
export function createRetryHandler(config?: Partial<RetryConfig>): RetryHandler {
  return new RetryHandler(config);
}

/**
 * 重試裝飾器
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config?: Partial<RetryConfig>
): (...args: T) => Promise<R> {
  const retryHandler = new RetryHandler(config);
  
  return async (...args: T): Promise<R> => {
    return retryHandler.execute(() => fn(...args), fn.name);
  };
}