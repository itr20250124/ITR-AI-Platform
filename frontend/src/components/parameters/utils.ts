import { ParameterDefinition } from '../../types';
import { ValidationResult, PerformancePrediction, ParameterSuggestion } from './types';

/**
 * 驗證單個參數
 */
export const validateParameter = (
  definition: ParameterDefinition,
  value: any
): { isValid: boolean; error?: string } => {
  if (value === undefined || value === null) {
    return { isValid: true }; // 使用預設值
  }

  switch (definition.type) {
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { isValid: false, error: '必須是有效數字' };
      }
      if (definition.min !== undefined && value < definition.min) {
        return { isValid: false, error: `不能小於 ${definition.min}` };
      }
      if (definition.max !== undefined && value > definition.max) {
        return { isValid: false, error: `不能大於 ${definition.max}` };
      }
      break;

    case 'select':
      if (definition.options && !definition.options.includes(value)) {
        return {
          isValid: false,
          error: `必須是以下選項之一: ${definition.options.join(', ')}`,
        };
      }
      break;

    case 'string':
      if (typeof value !== 'string') {
        return { isValid: false, error: '必須是文字' };
      }
      if (definition.min !== undefined && value.length < definition.min) {
        return { isValid: false, error: `長度不能少於 ${definition.min} 個字符` };
      }
      if (definition.max !== undefined && value.length > definition.max) {
        return { isValid: false, error: `長度不能超過 ${definition.max} 個字符` };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        return { isValid: false, error: '必須是布林值' };
      }
      break;
  }

  return { isValid: true };
};

/**
 * 驗證所有參數
 */
export const validateParameters = (
  definitions: ParameterDefinition[],
  values: Record<string, any>
): ValidationResult => {
  const errors: Array<{ field: string; message: string; code: string }> = [];
  const warnings: Array<{ field: string; message: string; code: string }> = [];

  definitions.forEach(definition => {
    const value = values[definition.key];
    const validation = validateParameter(definition, value);

    if (!validation.isValid && validation.error) {
      errors.push({
        field: definition.key,
        message: validation.error,
        code: 'VALIDATION_ERROR',
      });
    }
  });

  // 檢查未知參數
  Object.keys(values).forEach(key => {
    if (!definitions.find(def => def.key === key)) {
      warnings.push({
        field: key,
        message: '未知參數',
        code: 'UNKNOWN_PARAMETER',
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * 格式化參數值顯示
 */
export const formatParameterValue = (definition: ParameterDefinition, value: any): string => {
  if (value === undefined || value === null) {
    return definition.defaultValue !== undefined ? `${definition.defaultValue} (預設)` : '未設定';
  }

  if (definition.type === 'number') {
    if (definition.key === 'temperature') {
      return Number(value).toFixed(2);
    } else if (definition.key.includes('Token')) {
      return Number(value).toLocaleString();
    }
    return String(value);
  }

  if (definition.type === 'boolean') {
    return value ? '啟用' : '停用';
  }

  return String(value);
};

/**
 * 獲取參數建議
 */
export const getParameterSuggestions = (
  definitions: ParameterDefinition[],
  values: Record<string, any>
): ParameterSuggestion[] => {
  const suggestions: ParameterSuggestion[] = [];

  definitions.forEach(definition => {
    const value = values[definition.key];

    // 檢查是否使用預設值
    if (value === undefined && definition.defaultValue !== undefined) {
      suggestions.push({
        type: 'info',
        message: `建議設定 ${definition.key} 為 ${definition.defaultValue}`,
        parameter: definition.key,
        suggestedValue: definition.defaultValue,
      });
    }

    // 特定參數的建議
    if (definition.key === 'temperature' && typeof value === 'number') {
      if (value < 0.1) {
        suggestions.push({
          type: 'warning',
          message: '溫度過低可能導致回應過於重複',
          parameter: definition.key,
        });
      } else if (value > 1.5) {
        suggestions.push({
          type: 'warning',
          message: '溫度過高可能導致回應不連貫',
          parameter: definition.key,
        });
      }
    }

    if (
      (definition.key === 'maxTokens' || definition.key === 'maxOutputTokens') &&
      typeof value === 'number' &&
      value > 2000
    ) {
      suggestions.push({
        type: 'warning',
        message: '高token限制會增加API成本',
        parameter: definition.key,
      });
    }
  });

  return suggestions;
};

/**
 * 預測性能表現
 */
export const predictPerformance = (values: Record<string, any>): PerformancePrediction => {
  const temperature = values.temperature || 0.7;
  const maxTokens = values.maxTokens || values.maxOutputTokens || 1000;

  let creativity: 'low' | 'medium' | 'high' = 'medium';
  let consistency: 'low' | 'medium' | 'high' = 'medium';
  let speed: 'slow' | 'medium' | 'fast' = 'medium';
  let cost: 'low' | 'medium' | 'high' = 'medium';

  // 創意性預測
  if (temperature < 0.3) {
    creativity = 'low';
  } else if (temperature > 1.0) {
    creativity = 'high';
  }

  // 一致性預測
  if (temperature < 0.3) {
    consistency = 'high';
  } else if (temperature > 1.0) {
    consistency = 'low';
  }

  // 速度預測
  if (maxTokens < 500) {
    speed = 'fast';
  } else if (maxTokens > 2000) {
    speed = 'slow';
  }

  // 成本預測
  if (maxTokens < 500) {
    cost = 'low';
  } else if (maxTokens > 2000) {
    cost = 'high';
  }

  return { creativity, consistency, speed, cost };
};

/**
 * 計算參數差異
 */
export const calculateParameterDifferences = (
  params1: Record<string, any>,
  params2: Record<string, any>
): Array<{
  key: string;
  type: 'added' | 'removed' | 'changed' | 'unchanged';
  oldValue?: any;
  newValue?: any;
}> => {
  const keys1 = new Set(Object.keys(params1));
  const keys2 = new Set(Object.keys(params2));
  const allKeys = new Set([...keys1, ...keys2]);

  const differences: Array<{
    key: string;
    type: 'added' | 'removed' | 'changed' | 'unchanged';
    oldValue?: any;
    newValue?: any;
  }> = [];

  for (const key of allKeys) {
    if (!keys1.has(key)) {
      differences.push({ key, type: 'added', newValue: params2[key] });
    } else if (!keys2.has(key)) {
      differences.push({ key, type: 'removed', oldValue: params1[key] });
    } else if (params1[key] !== params2[key]) {
      differences.push({
        key,
        type: 'changed',
        oldValue: params1[key],
        newValue: params2[key],
      });
    } else {
      differences.push({ key, type: 'unchanged' });
    }
  }

  return differences;
};

/**
 * 合併參數與預設值
 */
export const mergeWithDefaults = (
  definitions: ParameterDefinition[],
  values: Record<string, any>
): Record<string, any> => {
  const merged: Record<string, any> = {};

  // 設置預設值
  definitions.forEach(definition => {
    if (definition.defaultValue !== undefined) {
      merged[definition.key] = definition.defaultValue;
    }
  });

  // 覆蓋用戶提供的值
  Object.entries(values).forEach(([key, value]) => {
    if (definitions.find(def => def.key === key) && value !== undefined) {
      merged[key] = value;
    }
  });

  return merged;
};

/**
 * 清理未知參數
 */
export const cleanUnknownParameters = (
  definitions: ParameterDefinition[],
  values: Record<string, any>
): Record<string, any> => {
  const cleaned: Record<string, any> = {};
  const knownKeys = definitions.map(def => def.key);

  Object.entries(values).forEach(([key, value]) => {
    if (knownKeys.includes(key)) {
      cleaned[key] = value;
    }
  });

  return cleaned;
};

/**
 * 獲取使用場景建議
 */
export const getUseCaseRecommendation = (values: Record<string, any>): string => {
  const temperature = values.temperature || 0.7;
  const maxTokens = values.maxTokens || values.maxOutputTokens || 1000;

  if (temperature < 0.3 && maxTokens < 1000) {
    return '📋 適合：問答、事實查詢、簡潔回應';
  } else if (temperature > 0.8 && maxTokens > 1500) {
    return '✍️ 適合：創意寫作、故事創作、頭腦風暴';
  } else if (temperature >= 0.3 && temperature <= 0.8) {
    return '💼 適合：一般對話、分析、解釋說明';
  } else {
    return '🔧 自定義設定，請根據具體需求調整';
  }
};
