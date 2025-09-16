import { ParameterDefinition } from '../../types';
import { ParameterValidator, ValidationResult } from '../../utils/parameterValidator';
import { ParameterManager, ParameterDefaultsManager, globalParameterManager } from './ParameterManager';
import { ParameterPresetsManager, ParameterPreset, globalPresetsManager } from './ParameterPresets';
import { AdvancedParameterValidator, globalAdvancedValidator } from './ParameterValidationRules';

/**
 * 參數驗證選項
 */
export interface ValidationOptions {
  strict?: boolean;
  includeWarnings?: boolean;
  validateDependencies?: boolean;
  validateCustomRules?: boolean;
}

/**
 * 完整的驗證結果
 */
export interface CompleteValidationResult extends ValidationResult {
  dependencyErrors?: string[];
  exclusionErrors?: string[];
  customRuleErrors?: string[];
  suggestions?: string[];
}

/**
 * 參數統計信息
 */
export interface ParameterStats {
  totalProviders: number;
  totalParameters: number;
  parametersByProvider: Record<string, number>;
  parametersByType: Record<string, number>;
  presetsCount: Record<string, number>;
}

/**
 * 統一參數服務
 */
export class ParameterService {
  private parameterManager: ParameterManager;
  private presetsManager: ParameterPresetsManager;
  private advancedValidator: AdvancedParameterValidator;

  constructor(
    parameterManager: ParameterManager = globalParameterManager,
    presetsManager: ParameterPresetsManager = globalPresetsManager,
    advancedValidator: AdvancedParameterValidator = globalAdvancedValidator
  ) {
    this.parameterManager = parameterManager;
    this.presetsManager = presetsManager;
    this.advancedValidator = advancedValidator;
  }

  /**
   * 註冊提供商參數定義
   */
  registerProvider(provider: string, definitions: ParameterDefinition[]): void {
    this.parameterManager.registerProvider(provider, definitions);
  }

  /**
   * 獲取提供商參數定義
   */
  getProviderDefinitions(provider: string): ParameterDefinition[] {
    return this.parameterManager.getProviderDefinitions(provider);
  }

  /**
   * 獲取所有提供商
   */
  getAllProviders(): string[] {
    return this.parameterManager.getAllProviders();
  }

  /**
   * 完整驗證參數
   */
  validateParameters(
    provider: string,
    parameters: Record<string, any>,
    options: ValidationOptions = {}
  ): CompleteValidationResult {
    const definitions = this.getProviderDefinitions(provider);
    
    // 基本驗證
    const basicResult = ParameterValidator.validateParameters(parameters, definitions);
    
    const result: CompleteValidationResult = {
      ...basicResult,
      suggestions: [],
    };

    // 高級驗證
    if (options.validateDependencies || options.validateCustomRules) {
      const advancedResult = this.advancedValidator.validateAdvanced(
        provider,
        parameters,
        definitions
      );
      
      result.isValid = result.isValid && advancedResult.valid;
      
      // 轉換字符串錯誤為ValidationError對象
      const advancedErrors = advancedResult.errors.map(errorMsg => ({
        field: 'advanced',
        code: 'ADVANCED_VALIDATION',
        message: errorMsg,
      }));
      result.errors.push(...advancedErrors);
      
      result.dependencyErrors = advancedResult.dependencyErrors;
      result.exclusionErrors = advancedResult.exclusionErrors;
      result.customRuleErrors = advancedResult.customRuleErrors;
    }

    // 生成建議
    if (options.includeWarnings) {
      result.suggestions = this.generateParameterSuggestions(provider, parameters);
    }

    return result;
  }

  /**
   * 合併參數與預設值
   */
  mergeWithDefaults(
    provider: string,
    parameters: Record<string, any>
  ): Record<string, any> {
    return this.parameterManager.mergeWithProviderDefaults(provider, parameters);
  }

  /**
   * 清理參數
   */
  cleanParameters(
    provider: string,
    parameters: Record<string, any>
  ): Record<string, any> {
    return this.parameterManager.cleanProviderParameters(provider, parameters);
  }

  /**
   * 轉換參數類型
   */
  convertParameters(
    provider: string,
    parameters: Record<string, any>
  ): Record<string, any> {
    return this.parameterManager.convertProviderParameters(provider, parameters);
  }

  /**
   * 獲取參數詳細信息
   */
  getParameterDetails(provider: string, parameterKey: string): ParameterDefinition | null {
    return this.parameterManager.getParameterDetails(provider, parameterKey);
  }

  /**
   * 檢查參數支持
   */
  supportsParameter(provider: string, parameterKey: string): boolean {
    return this.parameterManager.supportsParameter(provider, parameterKey);
  }

  /**
   * 獲取參數建議值
   */
  getParameterSuggestions(provider: string, parameterKey: string): any[] {
    return this.parameterManager.getParameterSuggestions(provider, parameterKey);
  }

  /**
   * 生成參數優化建議
   */
  generateParameterSuggestions(
    provider: string,
    parameters: Record<string, any>
  ): string[] {
    const suggestions: string[] = [];
    const definitions = this.getProviderDefinitions(provider);

    for (const definition of definitions) {
      const value = parameters[definition.key];
      
      if (value === undefined && definition.defaultValue !== undefined) {
        suggestions.push(`Consider setting ${definition.key} to ${definition.defaultValue} (default)`);
      }

      if (definition.type === 'number' && typeof value === 'number') {
        if (definition.key === 'temperature') {
          if (value < 0.3) {
            suggestions.push('Low temperature may produce repetitive responses');
          } else if (value > 1.2) {
            suggestions.push('High temperature may produce incoherent responses');
          }
        }

        if (definition.key === 'maxTokens' || definition.key === 'maxOutputTokens') {
          if (value > 2000) {
            suggestions.push('High token limit may result in expensive API calls');
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * 獲取提供商預設配置
   */
  getProviderPresets(provider: string): ParameterPreset[] {
    return this.presetsManager.getProviderPresets(provider);
  }

  /**
   * 根據ID獲取預設配置
   */
  getPresetById(provider: string, presetId: string): ParameterPreset | null {
    return this.presetsManager.getPresetById(provider, presetId);
  }

  /**
   * 應用預設配置
   */
  applyPreset(
    provider: string,
    presetId: string,
    overrides: Record<string, any> = {}
  ): Record<string, any> | null {
    const preset = this.getPresetById(provider, presetId);
    if (!preset) return null;

    return {
      ...preset.parameters,
      ...overrides,
    };
  }

  /**
   * 創建自定義預設配置
   */
  createCustomPreset(
    provider: string,
    name: string,
    description: string,
    parameters: Record<string, any>,
    tags: string[] = []
  ): ParameterPreset {
    return this.presetsManager.createCustomPreset(
      provider,
      name,
      description,
      parameters,
      tags
    );
  }

  /**
   * 設置提供商預設值
   */
  setProviderDefaults(provider: string, defaults: Record<string, any>): void {
    ParameterDefaultsManager.setProviderDefaults(provider, defaults);
  }

  /**
   * 獲取提供商預設值
   */
  getProviderDefaults(provider: string): Record<string, any> {
    return ParameterDefaultsManager.getProviderDefaults(provider);
  }

  /**
   * 獲取參數統計信息
   */
  getParameterStats(): ParameterStats {
    const providers = this.getAllProviders();
    const parametersByProvider: Record<string, number> = {};
    const parametersByType: Record<string, number> = {};
    const presetsCount: Record<string, number> = {};
    let totalParameters = 0;

    for (const provider of providers) {
      const definitions = this.getProviderDefinitions(provider);
      parametersByProvider[provider] = definitions.length;
      totalParameters += definitions.length;

      // 統計參數類型
      for (const def of definitions) {
        parametersByType[def.type] = (parametersByType[def.type] || 0) + 1;
      }

      // 統計預設配置
      const presets = this.getProviderPresets(provider);
      presetsCount[provider] = presets.length;
    }

    return {
      totalProviders: providers.length,
      totalParameters,
      parametersByProvider,
      parametersByType,
      presetsCount,
    };
  }

  /**
   * 比較兩組參數
   */
  compareParameters(
    params1: Record<string, any>,
    params2: Record<string, any>
  ) {
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
  }

  /**
   * 獲取參數摘要
   */
  getProviderParameterSummary(provider: string) {
    return this.parameterManager.getProviderParameterSummary(provider);
  }

  /**
   * 驗證並處理參數的完整流程
   */
  processParameters(
    provider: string,
    inputParameters: Record<string, any>,
    options: ValidationOptions = {}
  ): {
    valid: boolean;
    parameters: Record<string, any>;
    validation: CompleteValidationResult;
  } {
    // 1. 轉換參數類型
    const convertedParams = this.convertParameters(provider, inputParameters);
    
    // 2. 清理未知參數
    const cleanedParams = this.cleanParameters(provider, convertedParams);
    
    // 3. 合併預設值
    const mergedParams = this.mergeWithDefaults(provider, cleanedParams);
    
    // 4. 驗證參數
    const validation = this.validateParameters(provider, mergedParams, options);

    return {
      valid: validation.isValid,
      parameters: mergedParams,
      validation,
    };
  }
}

// 創建全域參數服務實例
export const globalParameterService = new ParameterService();