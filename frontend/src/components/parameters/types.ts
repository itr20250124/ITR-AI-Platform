import { ParameterDefinition } from '../../types'

// ParameterInput 組件類型
export interface ParameterInputProps {
  definition: ParameterDefinition
  value: any
  onChange: (value: any) => void
  error?: string
  disabled?: boolean
  className?: string
}

// ParameterSlider 組件類型
export interface ParameterSliderProps {
  definition: ParameterDefinition
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  showValue?: boolean
  className?: string
}

// ParameterPanel 組件類型
export interface ParameterPanelProps {
  provider: string
  definitions: ParameterDefinition[]
  values: Record<string, any>
  onChange: (values: Record<string, any>) => void
  onValidate?: (isValid: boolean, errors: string[]) => void
  presets?: Array<{
    id: string
    name: string
    description: string
    parameters: Record<string, any>
    tags: string[]
  }>
  className?: string
  showPresets?: boolean
  showSliders?: boolean
  showAdvanced?: boolean
}

// ParameterPreview 組件類型
export interface ParameterPreviewProps {
  provider: string
  definitions: ParameterDefinition[]
  values: Record<string, any>
  className?: string
}

// ParameterComparison 組件類型
export interface ParameterSet {
  id: string
  name: string
  values: Record<string, any>
  color?: string
}

export interface ParameterComparisonProps {
  definitions: ParameterDefinition[]
  parameterSets: ParameterSet[]
  className?: string
}

// ParameterHistory 組件類型
export interface ParameterHistoryEntry {
  id: string
  timestamp: Date
  values: Record<string, any>
  description?: string
  source: 'manual' | 'preset' | 'auto'
}

export interface ParameterHistoryProps {
  definitions: ParameterDefinition[]
  history: ParameterHistoryEntry[]
  currentValues: Record<string, any>
  onRestore: (values: Record<string, any>) => void
  onClear?: () => void
  className?: string
}

// 驗證結果類型
export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    field: string
    message: string
    code: string
  }>
  warnings: Array<{
    field: string
    message: string
    code: string
  }>
}

// 參數建議類型
export interface ParameterSuggestion {
  type: 'info' | 'warning' | 'error'
  message: string
  parameter?: string
  suggestedValue?: any
}

// 性能預測類型
export interface PerformancePrediction {
  creativity: 'low' | 'medium' | 'high'
  consistency: 'low' | 'medium' | 'high'
  speed: 'slow' | 'medium' | 'fast'
  cost: 'low' | 'medium' | 'high'
}

// 參數統計類型
export interface ParameterStats {
  totalParameters: number
  setParameters: number
  defaultParameters: number
  customParameters: number
  validationErrors: number
}
