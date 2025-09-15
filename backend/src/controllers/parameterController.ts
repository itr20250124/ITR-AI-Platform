import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AIServiceFactory } from '../services/ai/AIServiceFactory';
import { AIConfigManager } from '../services/ai/AIConfigManager';
import { globalParameterService } from '../services/parameters/ParameterService';

/**
 * 獲取所有可用的AI服務提供商
 */
export async function getAvailableProviders(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const configs = await AIConfigManager.getAllConfigs();
    
    const providers = configs.map(config => ({
      id: config.name,
      name: config.name,
      type: config.type,
      enabled: config.enabled,
      supportedParameters: config.supportedParameters,
      rateLimits: config.rateLimits,
    }));

    res.json({
      success: true,
      data: {
        providers,
        summary: {
          total: providers.length,
          chat: providers.filter(p => p.type === 'chat').length,
          image: providers.filter(p => p.type === 'image').length,
          video: providers.filter(p => p.type === 'video').length,
        },
      },
    });
  } catch (error) {
    console.error('Get providers error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取服務提供商失敗',
      },
    });
  }
}

/**
 * 根據類型獲取服務提供商
 */
export async function getProvidersByType(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { type } = req.params;
    
    if (!['chat', 'image', 'video'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: '無效的服務類型',
        },
      });
    }

    const configs = await AIConfigManager.getConfigsByType(type as 'chat' | 'image' | 'video');
    
    const providers = configs.map(config => ({
      id: config.name,
      name: config.name,
      type: config.type,
      enabled: config.enabled,
      supportedParameters: config.supportedParameters,
      rateLimits: config.rateLimits,
    }));

    res.json({
      success: true,
      data: {
        providers,
        type,
        count: providers.length,
      },
    });
  } catch (error) {
    console.error('Get providers by type error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取服務提供商失敗',
      },
    });
  }
}

/**
 * 獲取特定提供商的參數定義
 */
export async function getProviderParameters(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { provider, type } = req.params;
    
    if (!['chat', 'image', 'video'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TYPE',
          message: '無效的服務類型',
        },
      });
    }

    // 檢查提供商是否可用
    const isAvailable = AIServiceFactory.isProviderAvailable(provider, type as 'chat' | 'image' | 'video');
    if (!isAvailable) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROVIDER_NOT_FOUND',
          message: `服務提供商 ${provider} 不可用`,
        },
      });
    }

    // 獲取配置
    const config = await AIConfigManager.getConfigByName(provider);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: '找不到服務配置',
        },
      });
    }

    res.json({
      success: true,
      data: {
        provider,
        type,
        parameters: config.supportedParameters,
        rateLimits: config.rateLimits,
      },
    });
  } catch (error) {
    console.error('Get provider parameters error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取參數定義失敗',
      },
    });
  }
}

/**
 * 驗證參數
 */
export async function validateParameters(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { provider, type } = req.params;
    const { parameters } = req.body;

    if (!parameters || typeof parameters !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: '參數格式錯誤',
        },
      });
    }

    // 獲取參數定義
    const config = await AIConfigManager.getConfigByName(provider);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: '找不到服務配置',
        },
      });
    }

    // 驗證參數
    const validation = AIConfigManager.validateParameters(
      parameters,
      config.supportedParameters as any[]
    );

    if (validation.isValid) {
      // 合併預設參數
      const mergedParameters = AIConfigManager.mergeParameters(
        parameters,
        config.supportedParameters as any[]
      );

      res.json({
        success: true,
        data: {
          isValid: true,
          parameters: mergedParameters,
          message: '參數驗證通過',
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '參數驗證失敗',
          details: validation.errors,
        },
      });
    }
  } catch (error) {
    console.error('Validate parameters error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '參數驗證失敗',
      },
    });
  }
}

/**
 * 獲取參數預設值
 */
export async function getParameterDefaults(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { provider, type } = req.params;

    const config = await AIConfigManager.getConfigByName(provider);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CONFIG_NOT_FOUND',
          message: '找不到服務配置',
        },
      });
    }

    const defaults: Record<string, any> = {};
    const parameterDefinitions = config.supportedParameters as any[];
    
    for (const param of parameterDefinitions) {
      defaults[param.key] = param.defaultValue;
    }

    res.json({
      success: true,
      data: {
        provider,
        type,
        defaults,
        parameters: parameterDefinitions,
      },
    });
  } catch (error) {
    console.error('Get parameter defaults error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取預設參數失敗',
      },
    });
  }
}
/**

 * 獲取參數預設配置
 */
export async function getParameterPresets(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { provider } = req.params;
    const { tag } = req.query;

    let presets;
    if (tag && typeof tag === 'string') {
      presets = globalParameterService.getProviderPresets(provider).filter(
        preset => preset.tags.includes(tag)
      );
    } else {
      presets = globalParameterService.getProviderPresets(provider);
    }

    res.json({
      success: true,
      data: {
        provider,
        presets,
        count: presets.length,
      },
    });
  } catch (error) {
    console.error('Get parameter presets error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取參數預設配置失敗',
      },
    });
  }
}

/**
 * 創建自定義參數預設配置
 */
export async function createParameterPreset(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { provider } = req.params;
    const { name, description, parameters, tags = [] } = req.body;
    const userId = req.user?.id;

    if (!name || !description || !parameters) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: '缺少必要欄位：name, description, parameters',
        },
      });
    }

    // 驗證參數
    const validation = globalParameterService.validateParameters(provider, parameters);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: '參數驗證失敗',
          details: validation.errors,
        },
      });
    }

    const preset = globalParameterService.createCustomPreset(
      provider,
      name,
      description,
      parameters,
      tags,
      userId
    );

    res.status(201).json({
      success: true,
      data: preset,
      message: '預設配置創建成功',
    });
  } catch (error) {
    console.error('Create parameter preset error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '創建預設配置失敗',
      },
    });
  }
}

/**
 * 獲取參數統計信息
 */
export async function getParameterStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const stats = globalParameterService.getParameterStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get parameter stats error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取參數統計失敗',
      },
    });
  }
}

/**
 * 處理和驗證參數
 */
export async function processParameters(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { provider } = req.params;
    const { parameters, options = {} } = req.body;

    if (!parameters || typeof parameters !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: '參數格式錯誤',
        },
      });
    }

    const result = globalParameterService.processParameters(provider, parameters, {
      validateDependencies: true,
      validateCustomRules: true,
      includeWarnings: true,
      ...options,
    });

    if (result.valid) {
      res.json({
        success: true,
        data: {
          parameters: result.parameters,
          validation: result.validation,
          message: '參數處理成功',
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: '參數驗證失敗',
          details: result.validation,
        },
      });
    }
  } catch (error) {
    console.error('Process parameters error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '參數處理失敗',
      },
    });
  }
}