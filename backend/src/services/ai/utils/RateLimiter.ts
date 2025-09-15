import { RateLimitError } from '../../../types';

interface RateLimitRule {
  requests: number;
  period: number; // in seconds
  burst?: number;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

/**
 * 速率限制器
 */
export class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private rules: RateLimitRule[];

  constructor(rules: RateLimitRule[]) {
    this.rules = rules;
  }

  /**
   * 檢查是否允許請求
   */
  async checkLimit(identifier: string): Promise<void> {
    const now = Date.now();
    
    for (const rule of this.rules) {
      await this.enforceRule(identifier, rule, now);
    }
  }

  /**
   * 執行單個規則
   */
  private async enforceRule(
    identifier: string, 
    rule: RateLimitRule, 
    now: number
  ): Promise<void> {
    const key = `${identifier}:${rule.period}`;
    const records = this.requests.get(key) || [];
    
    // 清理過期記錄
    const validRecords = records.filter(
      record => now - record.timestamp < rule.period * 1000
    );

    // 計算當前時間窗口內的請求數
    const currentRequests = validRecords.reduce((sum, record) => sum + record.count, 0);

    // 檢查是否超過限制
    if (currentRequests >= rule.requests) {
      const oldestRecord = validRecords[0];
      const retryAfter = Math.ceil(
        (oldestRecord.timestamp + rule.period * 1000 - now) / 1000
      );
      
      throw new RateLimitError(
        retryAfter,
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      );
    }

    // 記錄當前請求
    validRecords.push({
      timestamp: now,
      count: 1,
    });

    this.requests.set(key, validRecords);
  }

  /**
   * 重置特定標識符的限制
   */
  reset(identifier: string): void {
    const keysToDelete = Array.from(this.requests.keys())
      .filter(key => key.startsWith(`${identifier}:`));
    
    keysToDelete.forEach(key => this.requests.delete(key));
  }

  /**
   * 清理所有過期記錄
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, records] of this.requests.entries()) {
      const [, periodStr] = key.split(':');
      const period = parseInt(periodStr) * 1000;
      
      const validRecords = records.filter(
        record => now - record.timestamp < period
      );
      
      if (validRecords.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRecords);
      }
    }
  }

  /**
   * 獲取剩餘請求數
   */
  getRemainingRequests(identifier: string): Record<string, number> {
    const now = Date.now();
    const remaining: Record<string, number> = {};

    for (const rule of this.rules) {
      const key = `${identifier}:${rule.period}`;
      const records = this.requests.get(key) || [];
      
      const validRecords = records.filter(
        record => now - record.timestamp < rule.period * 1000
      );
      
      const currentRequests = validRecords.reduce((sum, record) => sum + record.count, 0);
      remaining[`${rule.requests}/${rule.period}s`] = Math.max(0, rule.requests - currentRequests);
    }

    return remaining;
  }
}

/**
 * 全域速率限制器管理器
 */
export class RateLimiterManager {
  private limiters: Map<string, RateLimiter> = new Map();

  /**
   * 註冊速率限制器
   */
  register(provider: string, rules: RateLimitRule[]): void {
    this.limiters.set(provider, new RateLimiter(rules));
  }

  /**
   * 檢查限制
   */
  async checkLimit(provider: string, userId: string): Promise<void> {
    const limiter = this.limiters.get(provider);
    if (limiter) {
      await limiter.checkLimit(userId);
    }
  }

  /**
   * 重置用戶限制
   */
  resetUser(provider: string, userId: string): void {
    const limiter = this.limiters.get(provider);
    if (limiter) {
      limiter.reset(userId);
    }
  }

  /**
   * 獲取剩餘請求數
   */
  getRemainingRequests(provider: string, userId: string): Record<string, number> {
    const limiter = this.limiters.get(provider);
    return limiter ? limiter.getRemainingRequests(userId) : {};
  }

  /**
   * 清理過期記錄
   */
  cleanup(): void {
    for (const limiter of this.limiters.values()) {
      limiter.cleanup();
    }
  }
}

// 全域實例
export const rateLimiterManager = new RateLimiterManager();

// 定期清理過期記錄
setInterval(() => {
  rateLimiterManager.cleanup();
}, 60000); // 每分鐘清理一次