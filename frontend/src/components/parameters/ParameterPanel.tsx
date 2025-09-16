import React, { useState, useEffect } from 'react'
import { ParameterDefinition } from '../../types'
import { ParameterInput } from './ParameterInput'
import { ParameterSlider } from './ParameterSlider'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

interface ParameterPanelProps {
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

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  provider,
  definitions,
  values,
  onChange,
  onValidate,
  presets = [],
  className = '',
  showPresets = true,
  showSliders = true,
  showAdvanced = false,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [showAdvancedParams, setShowAdvancedParams] = useState(showAdvanced)
  const [viewMode, setViewMode] = useState<'input' | 'slider'>('input')

  // 基礎參數和高級參數分類
  const basicParams = definitions.filter(def =>
    ['model', 'temperature', 'maxTokens', 'maxOutputTokens'].includes(def.key)
  )
  const advancedParams = definitions.filter(
    def => !['model', 'temperature', 'maxTokens', 'maxOutputTokens'].includes(def.key)
  )

  // 驗證參數
  const validateParameter = (definition: ParameterDefinition, value: any): string | null => {
    if (value === undefined || value === null) {
      return null // 使用預設值
    }

    switch (definition.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return '必須是有效數字'
        }
        if (definition.min !== undefined && value < definition.min) {
          return `不能小於 ${definition.min}`
        }
        if (definition.max !== undefined && value > definition.max) {
          return `不能大於 ${definition.max}`
        }
        break

      case 'select':
        if (definition.options && !definition.options.includes(value)) {
          return `必須是以下選項之一: ${definition.options.join(', ')}`
        }
        break

      case 'string':
        if (typeof value !== 'string') {
          return '必須是文字'
        }
        if (definition.min !== undefined && value.length < definition.min) {
          return `長度不能少於 ${definition.min} 個字符`
        }
        if (definition.max !== undefined && value.length > definition.max) {
          return `長度不能超過 ${definition.max} 個字符`
        }
        break
    }

    return null
  }

  // 驗證所有參數
  const validateAll = () => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    definitions.forEach(definition => {
      const error = validateParameter(definition, values[definition.key])
      if (error) {
        newErrors[definition.key] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    onValidate?.(isValid, Object.values(newErrors))
    return isValid
  }

  // 當值改變時驗證
  useEffect(() => {
    validateAll()
  }, [values])

  // 處理參數值改變
  const handleParameterChange = (key: string, value: any) => {
    const newValues = { ...values, [key]: value }
    onChange(newValues)
  }

  // 應用預設配置
  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      onChange(preset.parameters)
      setSelectedPreset(presetId)
    }
  }

  // 重置為預設值
  const resetToDefaults = () => {
    const defaultValues: Record<string, any> = {}
    definitions.forEach(def => {
      if (def.defaultValue !== undefined) {
        defaultValues[def.key] = def.defaultValue
      }
    })
    onChange(defaultValues)
    setSelectedPreset('')
  }

  // 渲染參數組件
  const renderParameter = (definition: ParameterDefinition) => {
    const value = values[definition.key]
    const error = errors[definition.key]

    if (viewMode === 'slider' && definition.type === 'number' && showSliders) {
      return (
        <ParameterSlider
          key={definition.key}
          definition={definition}
          value={value ?? definition.defaultValue ?? 0}
          onChange={val => handleParameterChange(definition.key, val)}
        />
      )
    }

    return (
      <ParameterInput
        key={definition.key}
        definition={definition}
        value={value}
        onChange={val => handleParameterChange(definition.key, val)}
        error={error}
      />
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className='space-y-6'>
        {/* 標題和控制 */}
        <div className='flex justify-between items-center'>
          <h3 className='text-lg font-semibold text-gray-900'>{provider} 參數設定</h3>
          <div className='flex space-x-2'>
            {showSliders && (
              <div className='flex rounded-md shadow-sm'>
                <button
                  onClick={() => setViewMode('input')}
                  className={`px-3 py-1 text-sm rounded-l-md border ${
                    viewMode === 'input'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  輸入框
                </button>
                <button
                  onClick={() => setViewMode('slider')}
                  className={`px-3 py-1 text-sm rounded-r-md border-t border-r border-b ${
                    viewMode === 'slider'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  滑桿
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 預設配置選擇 */}
        {showPresets && presets.length > 0 && (
          <div className='space-y-3'>
            <label className='block text-sm font-medium text-gray-700'>預設配置</label>
            <div className='flex flex-wrap gap-2'>
              {presets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    selectedPreset === preset.id
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
              <Button
                variant='outline'
                size='sm'
                onClick={resetToDefaults}
                className='text-gray-600'
              >
                重置預設
              </Button>
            </div>
          </div>
        )}

        {/* 基礎參數 */}
        <div className='space-y-4'>
          <h4 className='text-md font-medium text-gray-800'>基礎參數</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {basicParams.map(renderParameter)}
          </div>
        </div>

        {/* 高級參數 */}
        {advancedParams.length > 0 && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h4 className='text-md font-medium text-gray-800'>高級參數</h4>
              <button
                onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                className='text-sm text-blue-600 hover:text-blue-800'
              >
                {showAdvancedParams ? '隱藏' : '顯示'}
              </button>
            </div>

            {showAdvancedParams && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {advancedParams.map(renderParameter)}
              </div>
            )}
          </div>
        )}

        {/* 參數摘要 */}
        <div className='pt-4 border-t border-gray-200'>
          <div className='flex justify-between items-center text-sm text-gray-600'>
            <span>
              已設定 {Object.keys(values).length} / {definitions.length} 個參數
            </span>
            <span className={Object.keys(errors).length > 0 ? 'text-red-600' : 'text-green-600'}>
              {Object.keys(errors).length > 0
                ? `${Object.keys(errors).length} 個錯誤`
                : '所有參數有效'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
