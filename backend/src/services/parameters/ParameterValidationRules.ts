import { ParameterDefinition } from '../../types';

/**
 * 自定義驗證規則
 */
export interface CustomValidationRule {
  name: string;
  description: string;
  validate: (
    value: any,
    definition: ParameterDefinition,
    allParameters: Record<string, any>
  ) => {
    valid: boolean;
    message?: string;
  };
}

/**
 * 參數依賴關係
 */
export interface ParameterDependency {
  parameter: string;
  dependsOn: string;
  condition: (dependentValue: any, dependsOnValue: any) => boolean;
  message: string;
}

/**
 * 參數互斥關係
 */
export interface ParameterMutualExclusion {
  parameters: string[];
  message: string;
}

/**
 * 高級參數驗證器
 */
export class AdvancedParameterValidator {
  private customRules: Map<string, CustomValidationRule[]> = new Map();
  private dependencies: Map<string, ParameterDependency[]> = new Map();
  private mutualExclusions: Map<string, ParameterMutualExclusion[]> = new Map();

  /**
   * 添加自定義驗證規則
   */
  addCustomRule(provider: string, rule: CustomValidationRule): void {
    const rules = this.customRules.get(provider) || [];
    rules.push(rule);
    this.customRules.set(provider, rules);
  }

  /**
   * 添加參數依賴關係
   */
  addDependency(provider: string, dependency: ParameterDependency): void {
    const deps = this.dependencies.get(provider) || [];
    deps.push(dependency);
    this.dependencies.set(provider, deps);
  }

  /**
   * 添加參數互斥關係
   */
  addMutualExclusion(provider: string, exclusion: ParameterMutualExclusion): void {
    const exclusions = this.mutualExclusions.get(provider) || [];
    exclusions.push(exclusion);
    this.mutualExclusions.set(provider, exclusions);
  }

  /**
   * 驗證參數依賴關係
   */
  validateDependencies(
    provider: string,
    parameters: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const dependencies = this.dependencies.get(provider) || [];
    const errors: string[] = [];

    for (const dep of dependencies) {
      const paramValue = parameters[dep.parameter];
      const dependsOnValue = parameters[dep.dependsOn];

      if (paramValue !== undefined && !dep.condition(paramValue, dependsOnValue)) {
        errors.push(dep.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 驗證參數互斥關係
   */
  validateMutualExclusions(
    provider: string,
    parameters: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const exclusions = this.mutualExclusions.get(provider) || [];
    const errors: string[] = [];

    for (const exclusion of exclusions) {
      const presentParameters = exclusion.parameters.filter(
        param => parameters[param] !== undefined
      );

      if (presentParameters.length > 1) {
        errors.push(exclusion.message);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 執行自定義驗證規則
   */
  validateCustomRules(
    provider: string,
    parameters: Record<string, any>,
    definitions: ParameterDefinition[]
  ): { valid: boolean; errors: string[] } {
    const rules = this.customRules.get(provider) || [];
    const errors: string[] = [];

    for (const rule of rules) {
      for (const definition of definitions) {
        const value = parameters[definition.key];
        if (value !== undefined) {
          const result = rule.validate(value, definition, parameters);
          if (!result.valid && result.message) {
            errors.push(`${rule.name}: ${result.message}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 完整的高級驗證
   */
  validateAdvanced(
    provider: string,
    parameters: Record<string, any>,
    definitions: ParameterDefinition[]
  ): {
    valid: boolean;
    errors: string[];
    dependencyErrors: string[];
    exclusionErrors: string[];
    customRuleErrors: string[];
  } {
    const dependencyResult = this.validateDependencies(provider, parameters);
    const exclusionResult = this.validateMutualExclusions(provider, parameters);
    const customRuleResult = this.validateCustomRules(provider, parameters, definitions);

    return {
      valid: dependencyResult.valid && exclusionResult.valid && customRuleResult.valid,
      errors: [...dependencyResult.errors, ...exclusionResult.errors, ...customRuleResult.errors],
      dependencyErrors: dependencyResult.errors,
      exclusionErrors: exclusionResult.errors,
      customRuleErrors: customRuleResult.errors,
    };
  }
}

/**
 * 內建驗證規則
 */
export class BuiltinValidationRules {
  /**
   * OpenAI 特定驗證規則
   */
  static getOpenAIRules(): CustomValidationRule[] {
    return [
      {
        name: 'DALL-E Model Compatibility',
        description: '檢查DALL-E模型與參數的兼容性',
        validate: (value, definition, allParams) => {
          if (definition.key === 'quality' && allParams.model === 'dall-e-2') {
            return {
              valid: value === 'standard',
              message: 'DALL-E 2 only supports standard quality',
            };
          }
          if (definition.key === 'style' && allParams.model === 'dall-e-2') {
            return {
              valid: value === undefined,
              message: 'DALL-E 2 does not support style parameter',
            };
          }
          if (definition.key === 'n' && allParams.model === 'dall-e-3') {
            return {
              valid: value === 1,
              message: 'DALL-E 3 only supports generating 1 image at a time',
            };
          }
          return { valid: true };
        },
      },
      {
        name: 'Temperature Range Check',
        description: '檢查溫度參數的合理範圍',
        validate: (value, definition) => {
          if (definition.key === 'temperature') {
            if (value < 0.1) {
              return {
                valid: false,
                message: 'Temperature below 0.1 may produce very repetitive responses',
              };
            }
            if (value > 1.5) {
              return {
                valid: false,
                message: 'Temperature above 1.5 may produce incoherent responses',
              };
            }
          }
          return { valid: true };
        },
      },
    ];
  }

  /**
   * Gemini 特定驗證規則
   */
  static getGeminiRules(): CustomValidationRule[] {
    return [
      {
        name: 'Gemini Temperature Range',
        description: '檢查Gemini溫度參數範圍',
        validate: (value, definition) => {
          if (definition.key === 'temperature' && value > 1) {
            return {
              valid: false,
              message: 'Gemini temperature must be between 0 and 1',
            };
          }
          return { valid: true };
        },
      },
      {
        name: 'TopK and TopP Balance',
        description: '檢查TopK和TopP參數的平衡',
        validate: (value, definition, allParams) => {
          if (definition.key === 'topK' && allParams.topP) {
            if (value > 20 && allParams.topP < 0.5) {
              return {
                valid: false,
                message: 'High topK with low topP may produce unexpected results',
              };
            }
          }
          return { valid: true };
        },
      },
    ];
  }

  /**
   * 通用驗證規則
   */
  static getCommonRules(): CustomValidationRule[] {
    return [
      {
        name: 'Token Limit Check',
        description: '檢查token限制的合理性',
        validate: (value, definition) => {
          if (
            (definition.key === 'maxTokens' || definition.key === 'maxOutputTokens') &&
            value > 4000
          ) {
            return {
              valid: false,
              message: 'Very high token limits may result in expensive API calls',
            };
          }
          return { valid: true };
        },
      },
      {
        name: 'Model Availability',
        description: '檢查模型是否可用',
        validate: (value, definition) => {
          if (definition.key === 'model') {
            // 這裡可以添加實際的模型可用性檢查
            const deprecatedModels = ['text-davinci-003', 'text-curie-001'];
            if (deprecatedModels.includes(value)) {
              return {
                valid: false,
                message: `Model ${value} is deprecated and may not be available`,
              };
            }
          }
          return { valid: true };
        },
      },
    ];
  }
}

/**
 * 內建參數依賴關係
 */
export class BuiltinDependencies {
  /**
   * OpenAI 參數依賴關係
   */
  static getOpenAIDependencies(): ParameterDependency[] {
    return [
      {
        parameter: 'quality',
        dependsOn: 'model',
        condition: (quality, model) => model === 'dall-e-3' || quality === 'standard',
        message: 'Quality parameter is only supported by DALL-E 3',
      },
      {
        parameter: 'style',
        dependsOn: 'model',
        condition: (style, model) => model === 'dall-e-3' || style === undefined,
        message: 'Style parameter is only supported by DALL-E 3',
      },
    ];
  }

  /**
   * 通用參數互斥關係
   */
  static getCommonMutualExclusions(): ParameterMutualExclusion[] {
    return [
      {
        parameters: ['maxTokens', 'maxOutputTokens'],
        message: 'Cannot specify both maxTokens and maxOutputTokens',
      },
    ];
  }
}

// 創建全域高級驗證器並載入內建規則
export const globalAdvancedValidator = new AdvancedParameterValidator();

// 載入OpenAI規則
BuiltinValidationRules.getOpenAIRules().forEach(rule => {
  globalAdvancedValidator.addCustomRule('openai', rule);
});

// 載入Gemini規則
BuiltinValidationRules.getGeminiRules().forEach(rule => {
  globalAdvancedValidator.addCustomRule('gemini', rule);
});

// 載入通用規則
BuiltinValidationRules.getCommonRules().forEach(rule => {
  globalAdvancedValidator.addCustomRule('openai', rule);
  globalAdvancedValidator.addCustomRule('gemini', rule);
});

// 載入依賴關係
BuiltinDependencies.getOpenAIDependencies().forEach(dep => {
  globalAdvancedValidator.addDependency('openai', dep);
});

// 載入互斥關係
BuiltinDependencies.getCommonMutualExclusions().forEach(exclusion => {
  globalAdvancedValidator.addMutualExclusion('openai', exclusion);
  globalAdvancedValidator.addMutualExclusion('gemini', exclusion);
});
