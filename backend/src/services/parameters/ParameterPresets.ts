import { ParameterDefinition } from '../../types';

/**
 * 參數預設配置
 */
export interface ParameterPreset {
  id: string;
  name: string;
  description: string;
  provider: string;
  parameters: Record<string, any>;
  tags: string[];
  isDefault?: boolean;
  createdBy?: string;
  createdAt: Date;
}

/**
 * 預設配置管理器
 */
export class ParameterPresetsManager {
  private presets: Map<string, ParameterPreset[]> = new Map();

  /**
   * 添加預設配置
   */
  addPreset(preset: ParameterPreset): void {
    const providerPresets = this.presets.get(preset.provider) || [];
    providerPresets.push(preset);
    this.presets.set(preset.provider, providerPresets);
  }

  /**
   * 獲取提供商的所有預設配置
   */
  getProviderPresets(provider: string): ParameterPreset[] {
    return this.presets.get(provider) || [];
  }

  /**
   * 根據ID獲取預設配置
   */
  getPresetById(provider: string, presetId: string): ParameterPreset | null {
    const presets = this.getProviderPresets(provider);
    return presets.find(preset => preset.id === presetId) || null;
  }

  /**
   * 根據標籤搜索預設配置
   */
  getPresetsByTag(provider: string, tag: string): ParameterPreset[] {
    const presets = this.getProviderPresets(provider);
    return presets.filter(preset => preset.tags.includes(tag));
  }

  /**
   * 獲取預設的預設配置
   */
  getDefaultPreset(provider: string): ParameterPreset | null {
    const presets = this.getProviderPresets(provider);
    return presets.find(preset => preset.isDefault) || null;
  }

  /**
   * 更新預設配置
   */
  updatePreset(provider: string, presetId: string, updates: Partial<ParameterPreset>): boolean {
    const presets = this.presets.get(provider);
    if (!presets) return false;

    const index = presets.findIndex(preset => preset.id === presetId);
    if (index === -1) return false;

    presets[index] = { ...presets[index], ...updates };
    return true;
  }

  /**
   * 刪除預設配置
   */
  removePreset(provider: string, presetId: string): boolean {
    const presets = this.presets.get(provider);
    if (!presets) return false;

    const index = presets.findIndex(preset => preset.id === presetId);
    if (index === -1) return false;

    presets.splice(index, 1);
    return true;
  }

  /**
   * 創建自定義預設配置
   */
  createCustomPreset(
    provider: string,
    name: string,
    description: string,
    parameters: Record<string, any>,
    tags: string[] = [],
    createdBy?: string
  ): ParameterPreset {
    const preset: ParameterPreset = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      provider,
      parameters: { ...parameters },
      tags,
      isDefault: false,
      createdBy,
      createdAt: new Date(),
    };

    this.addPreset(preset);
    return preset;
  }

  /**
   * 獲取所有提供商的預設配置統計
   */
  getPresetsStats(): Record<string, { total: number; default: number; custom: number }> {
    const stats: Record<string, { total: number; default: number; custom: number }> = {};

    for (const [provider, presets] of this.presets.entries()) {
      const defaultCount = presets.filter(p => p.isDefault).length;
      const customCount = presets.filter(p => p.id.startsWith('custom_')).length;

      stats[provider] = {
        total: presets.length,
        default: defaultCount,
        custom: customCount,
      };
    }

    return stats;
  }
}

/**
 * 內建預設配置
 */
export class BuiltinPresets {
  /**
   * OpenAI 聊天預設配置
   */
  static getOpenAIChatPresets(): ParameterPreset[] {
    return [
      {
        id: 'openai_chat_creative',
        name: '創意寫作',
        description: '適合創意寫作、故事創作和創意思考的參數設置',
        provider: 'openai',
        parameters: {
          model: 'gpt-4',
          temperature: 0.9,
          maxTokens: 2000,
          topP: 0.9,
          frequencyPenalty: 0.5,
          presencePenalty: 0.5,
        },
        tags: ['creative', 'writing', 'storytelling'],
        isDefault: false,
        createdAt: new Date(),
      },
      {
        id: 'openai_chat_analytical',
        name: '分析思考',
        description: '適合分析、推理和邏輯思考的參數設置',
        provider: 'openai',
        parameters: {
          model: 'gpt-4',
          temperature: 0.3,
          maxTokens: 1500,
          topP: 0.8,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
        },
        tags: ['analytical', 'reasoning', 'logic'],
        isDefault: false,
        createdAt: new Date(),
      },
      {
        id: 'openai_chat_balanced',
        name: '平衡模式',
        description: '平衡創意和準確性的通用參數設置',
        provider: 'openai',
        parameters: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
          topP: 1.0,
          frequencyPenalty: 0.0,
          presencePenalty: 0.0,
        },
        tags: ['balanced', 'general', 'default'],
        isDefault: true,
        createdAt: new Date(),
      },
      {
        id: 'openai_chat_concise',
        name: '簡潔回應',
        description: '生成簡潔、直接回應的參數設置',
        provider: 'openai',
        parameters: {
          model: 'gpt-3.5-turbo',
          temperature: 0.5,
          maxTokens: 500,
          topP: 0.9,
          frequencyPenalty: 0.2,
          presencePenalty: 0.1,
        },
        tags: ['concise', 'brief', 'direct'],
        isDefault: false,
        createdAt: new Date(),
      },
    ];
  }

  /**
   * Gemini 聊天預設配置
   */
  static getGeminiChatPresets(): ParameterPreset[] {
    return [
      {
        id: 'gemini_chat_creative',
        name: '創意模式',
        description: '適合創意寫作和創新思考的Gemini參數設置',
        provider: 'gemini',
        parameters: {
          model: 'gemini-pro',
          temperature: 0.9,
          maxOutputTokens: 2048,
          topP: 0.9,
          topK: 20,
        },
        tags: ['creative', 'writing', 'innovation'],
        isDefault: false,
        createdAt: new Date(),
      },
      {
        id: 'gemini_chat_precise',
        name: '精確模式',
        description: '適合需要精確和一致回應的參數設置',
        provider: 'gemini',
        parameters: {
          model: 'gemini-pro',
          temperature: 0.2,
          maxOutputTokens: 1024,
          topP: 0.8,
          topK: 5,
        },
        tags: ['precise', 'consistent', 'factual'],
        isDefault: false,
        createdAt: new Date(),
      },
      {
        id: 'gemini_chat_balanced',
        name: '平衡模式',
        description: 'Gemini的平衡參數設置',
        provider: 'gemini',
        parameters: {
          model: 'gemini-pro',
          temperature: 0.9,
          maxOutputTokens: 2048,
          topP: 1.0,
          topK: 1,
        },
        tags: ['balanced', 'general', 'default'],
        isDefault: true,
        createdAt: new Date(),
      },
    ];
  }

  /**
   * OpenAI 圖片生成預設配置
   */
  static getOpenAIImagePresets(): ParameterPreset[] {
    return [
      {
        id: 'openai_image_hd_square',
        name: '高清方形',
        description: '生成高清方形圖片的DALL-E 3設置',
        provider: 'openai',
        parameters: {
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'hd',
          style: 'vivid',
          n: 1,
        },
        tags: ['hd', 'square', 'vivid'],
        isDefault: false,
        createdAt: new Date(),
      },
      {
        id: 'openai_image_natural_landscape',
        name: '自然風景',
        description: '適合生成自然風景的參數設置',
        provider: 'openai',
        parameters: {
          model: 'dall-e-3',
          size: '1792x1024',
          quality: 'hd',
          style: 'natural',
          n: 1,
        },
        tags: ['natural', 'landscape', 'wide'],
        isDefault: false,
        createdAt: new Date(),
      },
      {
        id: 'openai_image_standard',
        name: '標準設置',
        description: '標準的圖片生成參數設置',
        provider: 'openai',
        parameters: {
          model: 'dall-e-3',
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid',
          n: 1,
        },
        tags: ['standard', 'default'],
        isDefault: true,
        createdAt: new Date(),
      },
      {
        id: 'openai_image_multiple_v2',
        name: '多圖生成',
        description: '使用DALL-E 2生成多張圖片',
        provider: 'openai',
        parameters: {
          model: 'dall-e-2',
          size: '1024x1024',
          n: 4,
        },
        tags: ['multiple', 'dall-e-2', 'batch'],
        isDefault: false,
        createdAt: new Date(),
      },
    ];
  }

  /**
   * 獲取所有內建預設配置
   */
  static getAllBuiltinPresets(): ParameterPreset[] {
    return [
      ...this.getOpenAIChatPresets(),
      ...this.getGeminiChatPresets(),
      ...this.getOpenAIImagePresets(),
    ];
  }
}

// 創建全域預設配置管理器並載入內建預設
export const globalPresetsManager = new ParameterPresetsManager();

// 載入內建預設配置
BuiltinPresets.getAllBuiltinPresets().forEach(preset => {
  globalPresetsManager.addPreset(preset);
});