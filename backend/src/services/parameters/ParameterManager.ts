import { ParameterDefinition } from '../../types';
import {
  ParameterValidator,
  ValidationResult,
} from '../../utils/parameterValidator';

/**
 * 參數預設值管理器
 */
export class ParameterDefaultsManager {
  private static defaults: Map<string, Record<string, any>> = new Map();

  /**
   * 設置提供商的預設參數
   */
  static setProviderDefaults(
    provider: string,
    defaults: Record<string, any>
  ): void {
    this.defaults.set(provider, { ...defaults });
  }

  /**
   * 獲取提供商的預設參數
   */
  static getProviderDefaults(provider: string): Record<string, any> {
    return this.defaults.get(provider) || {};
  }

  /**
   * 更新提供商的特定參數預設值
   */
  static updateProviderDefault(
    provider: string,
    key: string,
    value: any
  ): void {
    const current = this.getProviderDefaults(provider);
    current[key] = value;
    this.setProviderDefaults(provider, current);
  }

  /**
   * 移除提供商的預設參數
   */
  static removeProviderDefaults(provider: string): void {
    this.defaults.delete(provider);
  }

  /**
   * 獲取所有提供商的預設參數
   */
  static getAllDefaults(): Record<string, Record<string, any>> {
    const result: Record<string, Record<string, any>> = {};
    for (const [provider, defaults] of this.defaults.entries()) {
      result[provider] = { ...defaults };
    }
    return result;
  }
}

/**
 * 參數範圍檢查器
 */
export class ParameterRangeChecker {
  /**
   * 檢查數值參數是否在有效範圍內
   */
  static checkNumberRange(
    value: number,
    definition: ParameterDefinition
  ): { valid: boolean; message?: string } {
    if (definition.type !== 'number') {
      return { valid: true };
    }

    if (definition.min !== undefined && value < definition.min) {
      return {
        valid: false,
        message: `Value ${value} is below minimum ${definition.min}`,
      };
    }

    if (definition.max !== undefined && value > definition.max) {
      return {
        valid: false,
        message: `Value ${value} is above maximum ${definition.max}`,
      };
    }

    return { valid: true };
  }

  /**
   * 檢查字串參數長度
   */
  static checkStringLength(
    value: string,
    definition: ParameterDefinition
  ): { valid: boolean; message?: string } {
    if (definition.type !== 'string') {
      return { valid: true };
    }

    if (definition.min !== undefined && value.length < definition.min) {
      return {
        valid: false,
        message: `String length ${value.length} is below minimum ${definition.min}`,
      };
    }

    if (definition.max !== undefined && value.length > definition.max) {
      return {
        valid: false,
        message: `String length ${value.length} is above maximum ${definition.max}`,
      };
    }

    return { valid: true };
  }

  /**
   * 檢查選項參數是否有效
   */
  static checkSelectOption(
    value: any,
    definition: ParameterDefinition
  ): { valid: boolean; message?: string } {
    if (definition.type !== 'select' || !definition.options) {
      return { valid: true };
    }

    if (!definition.options.includes(value)) {
      return {
        valid: false,
        message: `Value "${value}" is not in allowed options: ${definition.options.join(', ')}`,
      };
    }

    return { valid: true };
  }
}

/**
 * 參數轉換器
 */
export class ParameterConverter {
  /**
   * 將字串轉換為適當的類型
   */
  static convertFromString(
    value: string,
    definition: ParameterDefinition
  ): any {
    switch (definition.type) {
      case 'number':
        const num = parseFloat(value);
        return isNaN(num) ? value : num;

      case 'boolean':
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
        return value;

      case 'select':
      case 'string':
      default:
        return value;
    }
  }

  /**
   * 批量轉換參數
   */
  static convertParameters(
    parameters: Record<string, any>,
    definitions: ParameterDefinition[]
  ): Record<string, any> {
    const converted: Record<string, any> = {};

    for (const [key, value] of Object.entries(parameters)) {
      const definition = definitions.find(def => def.key === key);
      if (definition && typeof value === 'string') {
        converted[key] = this.convertFromString(value, definition);
      } else {
        converted[key] = value;
      }
    }

    return converted;
  }
}

/**
 * 參數比較器
 */
export class ParameterComparator {
  /**
   * 比較兩組參數的差異
   */
  static compareParameters(
    params1: Record<string, any>,
    params2: Record<string, any>
  ): {
    added: string[];
    removed: string[];
    changed: Array<{ key: string; oldValue: any; newValue: any }>;
    unchanged: string[];
  } {
    const keys1 = new Set(Object.keys(params1));
    const keys2 = new Set(Object.keys(params2));
    const allKeys = new Set([...keys1, ...keys2]);

    const added: string[] = [];
    const removed: string[] = [];
    const changed: Array<{ key: string; oldValue: any; newValue: any }> = [];
    const unchanged: string[] = [];

    for (const key of allKeys) {
      if (!keys1.has(key)) {
        added.push(key);
      } else if (!keys2.has(key)) {
        removed.push(key);
      } else if (params1[key] !== params2[key]) {
        changed.push({
          key,
          oldValue: params1[key],
          newValue: params2[key],
        });
      } else {
        unchanged.push(key);
      }
    }

    return { added, removed, changed, unchanged };
  }

  /**
   * 檢查參數是否相等
   */
  static areParametersEqual(
    params1: Record<string, any>,
    params2: Record<string, any>
  ): boolean {
    const comparison = this.compareParameters(params1, params2);
    return (
      comparison.added.length === 0 &&
      comparison.removed.length === 0 &&
      comparison.changed.length === 0
    );
  }
}

/**
 * 主要參數管理器
 */
export class ParameterManager {
  private definitions: Map<string, ParameterDefinition[]> = new Map();

  /**
   * 註冊提供商的參數定義
   */
  registerProvider(provider: string, definitions: ParameterDefinition[]): void {
    this.definitions.set(provider, [...definitions]);
  }

  /**
   * 獲取提供商的參數定義
   */
  getProviderDefinitions(provider: string): ParameterDefinition[] {
    return this.definitions.get(provider) || [];
  }

  /**
   * 獲取所有提供商
   */
  getAllProviders(): string[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * 驗證提供商參數
   */
  validateProviderParameters(
    provider: string,
    parameters: Record<string, any>
  ): ValidationResult {
    const definitions = this.getProviderDefinitions(provider);
    return ParameterValidator.validateParameters(parameters, definitions);
  }

  /**
   * 合併提供商參數與預設值
   */
  mergeWithProviderDefaults(
    provider: string,
    parameters: Record<string, any>
  ): Record<string, any> {
    const definitions = this.getProviderDefinitions(provider);
    const providerDefaults =
      ParameterDefaultsManager.getProviderDefaults(provider);

    // 首先合併定義中的預設值
    const merged = ParameterValidator.mergeWithDefaults(
      parameters,
      definitions
    );

    // 然後合併提供商特定的預設值
    for (const [key, value] of Object.entries(providerDefaults)) {
      if (merged[key] === undefined) {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * 清理提供商參數
   */
  cleanProviderParameters(
    provider: string,
    parameters: Record<string, any>
  ): Record<string, any> {
    const definitions = this.getProviderDefinitions(provider);
    return ParameterValidator.cleanParameters(parameters, definitions);
  }

  /**
   * 獲取提供商參數摘要
   */
  getProviderParameterSummary(provider: string) {
    const definitions = this.getProviderDefinitions(provider);
    return ParameterValidator.getParameterSummary(definitions);
  }

  /**
   * 轉換提供商參數類型
   */
  convertProviderParameters(
    provider: string,
    parameters: Record<string, any>
  ): Record<string, any> {
    const definitions = this.getProviderDefinitions(provider);
    return ParameterConverter.convertParameters(parameters, definitions);
  }

  /**
   * 獲取參數定義的詳細信息
   */
  getParameterDetails(
    provider: string,
    parameterKey: string
  ): ParameterDefinition | null {
    const definitions = this.getProviderDefinitions(provider);
    return definitions.find(def => def.key === parameterKey) || null;
  }

  /**
   * 檢查提供商是否支持特定參數
   */
  supportsParameter(provider: string, parameterKey: string): boolean {
    return this.getParameterDetails(provider, parameterKey) !== null;
  }

  /**
   * 獲取參數的建議值
   */
  getParameterSuggestions(provider: string, parameterKey: string): any[] {
    const definition = this.getParameterDetails(provider, parameterKey);
    if (!definition) return [];

    switch (definition.type) {
      case 'select':
        return definition.options || [];

      case 'boolean':
        return [true, false];

      case 'number':
        const suggestions: number[] = [];
        if (definition.defaultValue !== undefined) {
          suggestions.push(definition.defaultValue);
        }
        if (definition.min !== undefined) {
          suggestions.push(definition.min);
        }
        if (definition.max !== undefined) {
          suggestions.push(definition.max);
        }
        return suggestions;

      default:
        return definition.defaultValue !== undefined
          ? [definition.defaultValue]
          : [];
    }
  }
}

// 創建全域參數管理器實例
export const globalParameterManager = new ParameterManager();
