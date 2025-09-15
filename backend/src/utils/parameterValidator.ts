import { ParameterDefinition } from '../types';

/**
 * 參數驗證結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * 驗證錯誤
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

/**
 * 驗證警告
 */
export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  value?: any;
}

/**
 * 參數驗證器類
 */
export class ParameterValidator {
  /**
   * 驗證單個參數
   */
  static validateParameter(
    key: string,
    value: any,
    definition: ParameterDefinition
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // 檢查必填參數
    if (value === undefined || value === null) {
      if (definition.defaultValue === undefined) {
        errors.push({
          field: key,
          code: 'REQUIRED',
          message: `Parameter ${key} is required`,
          value,
        });
      }
      return errors;
    }

    // 類型檢查
    switch (definition.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push({
            field: key,
            code: 'INVALID_TYPE',
            message: `Parameter ${key} must be a number`,
            value,
          });
          break;
        }

        // 範圍檢查
        if (definition.min !== undefined && value < definition.min) {
          errors.push({
            field: key,
            code: 'OUT_OF_RANGE',
            message: `Parameter ${key} must be >= ${definition.min}`,
            value,
          });
        }

        if (definition.max !== undefined && value > definition.max) {
          errors.push({
            field: key,
            code: 'OUT_OF_RANGE',
            message: `Parameter ${key} must be <= ${definition.max}`,
            value,
          });
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            field: key,
            code: 'INVALID_TYPE',
            message: `Parameter ${key} must be a string`,
            value,
          });
          break;
        }

        // 長度檢查
        if (definition.min !== undefined && value.length < definition.min) {
          errors.push({
            field: key,
            code: 'TOO_SHORT',
            message: `Parameter ${key} must be at least ${definition.min} characters`,
            value,
          });
        }

        if (definition.max !== undefined && value.length > definition.max) {
          errors.push({
            field: key,
            code: 'TOO_LONG',
            message: `Parameter ${key} must be at most ${definition.max} characters`,
            value,
          });
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            field: key,
            code: 'INVALID_TYPE',
            message: `Parameter ${key} must be a boolean`,
            value,
          });
        }
        break;

      case 'select':
        if (definition.options && !definition.options.includes(value)) {
          errors.push({
            field: key,
            code: 'INVALID_OPTION',
            message: `Parameter ${key} must be one of: ${definition.options.join(', ')}`,
            value,
          });
        }
        break;

      default:
        errors.push({
          field: key,
          code: 'UNKNOWN_TYPE',
          message: `Unknown parameter type: ${definition.type}`,
          value,
        });
    }

    return errors;
  }

  /**
   * 驗證參數集合
   */
  static validateParameters(
    parameters: Record<string, any>,
    definitions: ParameterDefinition[]
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 驗證已知參數
    for (const definition of definitions) {
      const value = parameters[definition.key];
      const paramErrors = this.validateParameter(definition.key, value, definition);
      errors.push(...paramErrors);
    }

    // 檢查未知參數
    for (const key of Object.keys(parameters)) {
      const definition = definitions.find(def => def.key === key);
      if (!definition) {
        warnings.push({
          field: key,
          code: 'UNKNOWN_PARAMETER',
          message: `Unknown parameter: ${key}`,
          value: parameters[key],
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 合併預設參數
   */
  static mergeWithDefaults(
    parameters: Record<string, any>,
    definitions: ParameterDefinition[]
  ): Record<string, any> {
    const merged: Record<string, any> = {};

    // 設置預設值
    for (const definition of definitions) {
      if (definition.defaultValue !== undefined) {
        merged[definition.key] = definition.defaultValue;
      }
    }

    // 覆蓋用戶提供的值
    for (const [key, value] of Object.entries(parameters)) {
      const definition = definitions.find(def => def.key === key);
      if (definition && value !== undefined && value !== null) {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * 清理參數（移除未知參數）
   */
  static cleanParameters(
    parameters: Record<string, any>,
    definitions: ParameterDefinition[]
  ): Record<string, any> {
    const cleaned: Record<string, any> = {};
    const knownKeys = definitions.map(def => def.key);

    for (const [key, value] of Object.entries(parameters)) {
      if (knownKeys.includes(key)) {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /**
   * 獲取參數摘要
   */
  static getParameterSummary(definitions: ParameterDefinition[]): {
    total: number;
    byType: Record<string, number>;
    required: number;
    optional: number;
  } {
    const byType: Record<string, number> = {};
    let required = 0;
    let optional = 0;

    for (const definition of definitions) {
      // 統計類型
      byType[definition.type] = (byType[definition.type] || 0) + 1;

      // 統計必填/可選
      if (definition.defaultValue === undefined) {
        required++;
      } else {
        optional++;
      }
    }

    return {
      total: definitions.length,
      byType,
      required,
      optional,
    };
  }
}