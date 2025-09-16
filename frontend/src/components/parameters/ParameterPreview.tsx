import React from 'react'
import { ParameterDefinition } from '../../types'
import { Card } from '../ui/Card'

interface ParameterPreviewProps {
  provider: string
  definitions: ParameterDefinition[]
  values: Record<string, any>
  className?: string
}

export const ParameterPreview: React.FC<ParameterPreviewProps> = ({
  provider,
  definitions,
  values,
  className = '',
}) => {
  // 計算預估成本（基於token數量）
  const estimateCost = () => {
    const maxTokens = values.maxTokens || values.maxOutputTokens || 1000
    const model = values.model || 'gpt-3.5-turbo'

    // 簡化的成本計算（實際應該從API獲取最新價格）
    const costPerToken =
      {
        'gpt-3.5-turbo': 0.000002,
        'gpt-4': 0.00003,
        'gpt-4-turbo': 0.00001,
        'gpt-4o': 0.000005,
        'gemini-pro': 0.000001,
        'dall-e-2': 0.02,
        'dall-e-3': 0.04,
      }[model] || 0.000002

    return (maxTokens * costPerToken).toFixed(4)
  }

  // 獲取參數建議
  const getParameterInsights = () => {
    const insights: Array<{ type: 'info' | 'warning' | 'error'; message: string }> = []

    const temperature = values.temperature
    if (temperature !== undefined) {
      if (temperature < 0.3) {
        insights.push({
          type: 'info',
          message: '低溫度設定會產生更一致但可能較重複的回應',
        })
      } else if (temperature > 1.2) {
        insights.push({
          type: 'warning',
          message: '高溫度設定可能產生不連貫或不相關的回應',
        })
      }
    }

    const maxTokens = values.maxTokens || values.maxOutputTokens
    if (maxTokens && maxTokens > 2000) {
      insights.push({
        type: 'warning',
        message: '高token限制會增加API成本',
      })
    }

    const model = values.model
    if (model === 'dall-e-3' && values.n > 1) {
      insights.push({
        type: 'error',
        message: 'DALL-E 3 只支援生成一張圖片',
      })
    }

    return insights
  }

  // 獲取性能預測
  const getPerformancePrediction = () => {
    const temperature = values.temperature || 0.7
    const maxTokens = values.maxTokens || values.maxOutputTokens || 1000

    let creativity = '中等'
    let consistency = '中等'
    let speed = '中等'

    if (temperature < 0.3) {
      creativity = '低'
      consistency = '高'
    } else if (temperature > 1.0) {
      creativity = '高'
      consistency = '低'
    }

    if (maxTokens < 500) {
      speed = '快'
    } else if (maxTokens > 2000) {
      speed = '慢'
    }

    return { creativity, consistency, speed }
  }

  const insights = getParameterInsights()
  const performance = getPerformancePrediction()
  const estimatedCost = estimateCost()

  return (
    <Card className={`p-6 ${className}`}>
      <div className='space-y-6'>
        <h3 className='text-lg font-semibold text-gray-900'>參數預覽</h3>

        {/* 當前設定摘要 */}
        <div className='space-y-3'>
          <h4 className='text-md font-medium text-gray-800'>當前設定</h4>
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              {definitions.map(def => {
                const value = values[def.key] ?? def.defaultValue
                return (
                  <div key={def.key} className='flex justify-between'>
                    <span className='text-gray-600'>{def.key}:</span>
                    <span className='font-mono text-gray-900'>
                      {value !== undefined ? String(value) : '未設定'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 性能預測 */}
        <div className='space-y-3'>
          <h4 className='text-md font-medium text-gray-800'>性能預測</h4>
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <div className='text-2xl mb-1'>🎨</div>
              <div className='text-sm text-gray-600'>創意性</div>
              <div className='font-medium'>{performance.creativity}</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl mb-1'>🎯</div>
              <div className='text-sm text-gray-600'>一致性</div>
              <div className='font-medium'>{performance.consistency}</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl mb-1'>⚡</div>
              <div className='text-sm text-gray-600'>速度</div>
              <div className='font-medium'>{performance.speed}</div>
            </div>
          </div>
        </div>

        {/* 成本預估 */}
        <div className='space-y-3'>
          <h4 className='text-md font-medium text-gray-800'>成本預估</h4>
          <div className='bg-blue-50 rounded-lg p-4'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-600'>預估每次請求成本:</span>
              <span className='text-lg font-bold text-blue-600'>${estimatedCost}</span>
            </div>
            <div className='text-xs text-gray-500 mt-1'>
              基於 {values.model || 'gpt-3.5-turbo'} 模型和{' '}
              {values.maxTokens || values.maxOutputTokens || 1000} tokens
            </div>
          </div>
        </div>

        {/* 建議和警告 */}
        {insights.length > 0 && (
          <div className='space-y-3'>
            <h4 className='text-md font-medium text-gray-800'>建議</h4>
            <div className='space-y-2'>
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg text-sm ${
                    insight.type === 'error'
                      ? 'bg-red-50 text-red-800 border border-red-200'
                      : insight.type === 'warning'
                        ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  <div className='flex items-start space-x-2'>
                    <span className='text-lg'>
                      {insight.type === 'error' ? '❌' : insight.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span>{insight.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使用場景建議 */}
        <div className='space-y-3'>
          <h4 className='text-md font-medium text-gray-800'>適用場景</h4>
          <div className='text-sm text-gray-600'>
            {(() => {
              const temp = values.temperature || 0.7
              const maxTokens = values.maxTokens || values.maxOutputTokens || 1000

              if (temp < 0.3 && maxTokens < 1000) {
                return '📋 適合：問答、事實查詢、簡潔回應'
              } else if (temp > 0.8 && maxTokens > 1500) {
                return '✍️ 適合：創意寫作、故事創作、頭腦風暴'
              } else if (temp >= 0.3 && temp <= 0.8) {
                return '💼 適合：一般對話、分析、解釋說明'
              } else {
                return '🔧 自定義設定，請根據具體需求調整'
              }
            })()}
          </div>
        </div>
      </div>
    </Card>
  )
}
