import { apiClient } from './api'
import { ParameterDefinition } from '../types'

export interface AIProvider {
  id: string
  name: string
  type: 'chat' | 'image' | 'video'
  enabled: boolean
  supportedParameters: ParameterDefinition[]
  rateLimits: any[]
}

export interface ProviderSummary {
  total: number
  chat: number
  image: number
  video: number
}

export interface ValidationResult {
  isValid: boolean
  parameters?: Record<string, any>
  message?: string
  errors?: Array<{
    field: string
    message: string
  }>
}

/**
 * 參數服務類
 */
export class ParameterService {
  /**
   * 獲取所有可用的AI服務提供商
   */
  static async getAvailableProviders(): Promise<{
    providers: AIProvider[]
    summary: ProviderSummary
  }> {
    const response = await apiClient.get<{
      providers: AIProvider[]
      summary: ProviderSummary
    }>('/parameters/providers')

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch providers')
    }

    return response.data!
  }

  /**
   * 根據類型獲取服務提供商
   */
  static async getProvidersByType(type: 'chat' | 'image' | 'video'): Promise<{
    providers: AIProvider[]
    type: string
    count: number
  }> {
    const response = await apiClient.get<{
      providers: AIProvider[]
      type: string
      count: number
    }>(`/parameters/providers/${type}`)

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch providers')
    }

    return response.data!
  }

  /**
   * 獲取特定提供商的參數定義
   */
  static async getProviderParameters(
    provider: string,
    type: 'chat' | 'image' | 'video'
  ): Promise<{
    provider: string
    type: string
    parameters: ParameterDefinition[]
    rateLimits: any[]
  }> {
    const response = await apiClient.get<{
      provider: string
      type: string
      parameters: ParameterDefinition[]
      rateLimits: any[]
    }>(`/parameters/${provider}/${type}`)

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch parameters')
    }

    return response.data!
  }

  /**
   * 驗證參數
   */
  static async validateParameters(
    provider: string,
    type: 'chat' | 'image' | 'video',
    parameters: Record<string, any>
  ): Promise<ValidationResult> {
    const response = await apiClient.post<ValidationResult>(
      `/parameters/${provider}/${type}/validate`,
      { parameters }
    )

    if (!response.success) {
      return {
        isValid: false,
        errors: response.error?.details || [
          { field: 'general', message: response.error?.message || 'Validation failed' },
        ],
      }
    }

    return response.data!
  }

  /**
   * 獲取參數預設值
   */
  static async getParameterDefaults(
    provider: string,
    type: 'chat' | 'image' | 'video'
  ): Promise<{
    provider: string
    type: string
    defaults: Record<string, any>
    parameters: ParameterDefinition[]
  }> {
    const response = await apiClient.get<{
      provider: string
      type: string
      defaults: Record<string, any>
      parameters: ParameterDefinition[]
    }>(`/parameters/${provider}/${type}/defaults`)

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to fetch defaults')
    }

    return response.data!
  }
}
