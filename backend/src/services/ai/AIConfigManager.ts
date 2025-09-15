import { PrismaClient } from '@prisma/client';
import { ParameterDefinition } from '../../types';

const prisma = new PrismaClient();

/**
 * AI服務配置管理器
 */
export class AIConfigManager {
  /**
   * 獲取所有AI提供商配置
   */
  static async getAllConfigs() {
    return prisma.aIProviderConfig.findMany({
      where: { enabled: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * 根據名稱獲取配置
   */
  static async getConfigByName(name: string) {
    return prisma.aIProviderConfig.findUnique({
      where: { name },
    });
  }

  /**
   * 根據類型獲取配置
   */
  static async getConfigsByType(type: 'chat' | 'image' | 'video') {
    return prisma.aIProviderConfig.findMany({
      where: { 
        type,
        enabled: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * 創建或更新配置
   */
  static async upsertConfig(data: {
    name: string;
    type: string;
    apiEndpoint: string;
    apiKeyRequired?: boolean;
    supportedParameters?: ParameterDefinition[];
    rateLimits?: any[];
    enabled?: boolean;
  }) {
    return prisma.aIProviderConfig.upsert({
      where: { name: data.name },
      update: {
        type: data.type,
        apiEndpoint: data.apiEndpoint,
        apiKeyRequired: data.apiKeyRequired ?? true,
        supportedParameters: data.supportedParameters ?? [],
        rateLimits: data.rateLimits ?? [],
        enabled: data.enabled ?? true,
      },
      create: {
        name: data.name,
        type: data.type,
        apiEndpoint: data.apiEndpoint,
        apiKeyRequired: data.apiKeyRequired ?? true,
        supportedParameters: data.supportedParameters ?? [],
        rateLimits: data.rateLimits ?? [],
        enabled: data.enabled ?? true,
      },
    });
  }

  /**
   * 啟用/禁用配置
   */
  static async toggleConfig(name: string, enabled: boolean) {
    return prisma.aIProviderConfig.update({
      where: { name },
      data: { enabled },
    });
  }

  /**
   * 刪除配置
   */
  static async deleteConfig(name: string) {
    return prisma.aIProviderConfig.delete({
      where: { name },
    });
  }

  /**
   * 驗證參數
   */
  static validateParameters(
    parameters: Record<string, any>,
    parameterDefinitions: ParameterDefinition[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, value] of Object.entries(parameters)) {
      const definition = parameterDefinitions.find(def => def.key === key);
      
      if (!definition) {
        errors.push(`Unknown parameter: ${key}`);
        continue;
      }

      // 類型檢查
      switch (definition.type) {
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Parameter ${key} must be a number`);
            break;
          }
          if (definition.min !== undefined && value < definition.min) {
            errors.push(`Parameter ${key} must be >= ${definition.min}`);
          }
          if (definition.max !== undefined && value > definition.max) {
            errors.push(`Parameter ${key} must be <= ${definition.max}`);
          }
          break;

        case 'string':
          if (typeof value !== 'string') {
            errors.push(`Parameter ${key} must be a string`);
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Parameter ${key} must be a boolean`);
          }
          break;

        case 'select':
          if (definition.options && !definition.options.includes(value)) {
            errors.push(`Parameter ${key} must be one of: ${definition.options.join(', ')}`);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 合併預設參數和用戶參數
   */
  static mergeParameters(
    userParameters: Record<string, any>,
    parameterDefinitions: ParameterDefinition[]
  ): Record<string, any> {
    const merged: Record<string, any> = {};

    // 先設置所有預設值
    for (const definition of parameterDefinitions) {
      merged[definition.key] = definition.defaultValue;
    }

    // 覆蓋用戶提供的值
    for (const [key, value] of Object.entries(userParameters)) {
      if (parameterDefinitions.some(def => def.key === key)) {
        merged[key] = value;
      }
    }

    return merged;
  }
}