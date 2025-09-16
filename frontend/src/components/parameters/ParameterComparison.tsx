import React from 'react'
import { ParameterDefinition } from '../../types'
import { Card } from '../ui/Card'

interface ParameterSet {
  id: string
  name: string
  values: Record<string, any>
  color?: string
}

interface ParameterComparisonProps {
  definitions: ParameterDefinition[]
  parameterSets: ParameterSet[]
  className?: string
}

export const ParameterComparison: React.FC<ParameterComparisonProps> = ({
  definitions,
  parameterSets,
  className = '',
}) => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-pink-100 text-pink-800 border-pink-200',
  ]

  const formatValue = (definition: ParameterDefinition, value: any) => {
    if (value === undefined || value === null) {
      return definition.defaultValue !== undefined ? `${definition.defaultValue} (預設)` : '未設定'
    }

    if (definition.type === 'number') {
      if (definition.key === 'temperature') {
        return Number(value).toFixed(2)
      } else if (definition.key.includes('Token')) {
        return Number(value).toLocaleString()
      }
      return String(value)
    }

    return String(value)
  }

  const getValueDifference = (definition: ParameterDefinition, values: any[]) => {
    const uniqueValues = [...new Set(values.filter(v => v !== undefined))]
    return uniqueValues.length > 1
  }

  const getPerformanceComparison = (parameterSet: ParameterSet) => {
    const temp = parameterSet.values.temperature || 0.7
    const maxTokens = parameterSet.values.maxTokens || parameterSet.values.maxOutputTokens || 1000

    return {
      creativity: temp < 0.3 ? '低' : temp > 1.0 ? '高' : '中',
      consistency: temp < 0.3 ? '高' : temp > 1.0 ? '低' : '中',
      cost: maxTokens < 500 ? '低' : maxTokens > 2000 ? '高' : '中',
      speed: maxTokens < 500 ? '快' : maxTokens > 2000 ? '慢' : '中',
    }
  }

  if (parameterSets.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className='text-center text-gray-500'>
          <div className='text-4xl mb-2'>📊</div>
          <p>選擇多個參數設定進行比較</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className='space-y-6'>
        <h3 className='text-lg font-semibold text-gray-900'>參數比較</h3>

        {/* 參數對比表 */}
        <div className='overflow-x-auto'>
          <table className='w-full border-collapse'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='text-left py-3 px-4 font-medium text-gray-700'>參數</th>
                {parameterSets.map((set, index) => (
                  <th key={set.id} className='text-center py-3 px-4'>
                    <div
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${
                        set.color || colors[index % colors.length]
                      }`}
                    >
                      {set.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {definitions.map(definition => {
                const values = parameterSets.map(set => set.values[definition.key])
                const hasDifference = getValueDifference(definition, values)

                return (
                  <tr
                    key={definition.key}
                    className={`border-b border-gray-100 ${hasDifference ? 'bg-yellow-50' : ''}`}
                  >
                    <td className='py-3 px-4'>
                      <div className='flex items-center space-x-2'>
                        <span className='font-medium text-gray-900'>{definition.key}</span>
                        {hasDifference && (
                          <span className='text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded'>
                            差異
                          </span>
                        )}
                      </div>
                      <div className='text-xs text-gray-500 mt-1'>{definition.description}</div>
                    </td>
                    {parameterSets.map((set, index) => (
                      <td key={set.id} className='py-3 px-4 text-center'>
                        <span className={`font-mono text-sm ${hasDifference ? 'font-bold' : ''}`}>
                          {formatValue(definition, set.values[definition.key])}
                        </span>
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 性能比較 */}
        <div className='space-y-4'>
          <h4 className='text-md font-medium text-gray-800'>性能比較</h4>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {['creativity', 'consistency', 'cost', 'speed'].map(metric => (
              <div key={metric} className='space-y-2'>
                <h5 className='text-sm font-medium text-gray-700 capitalize'>
                  {metric === 'creativity'
                    ? '創意性'
                    : metric === 'consistency'
                      ? '一致性'
                      : metric === 'cost'
                        ? '成本'
                        : '速度'}
                </h5>
                <div className='space-y-1'>
                  {parameterSets.map((set, index) => {
                    const performance = getPerformanceComparison(set)
                    const value = performance[metric as keyof typeof performance]
                    return (
                      <div key={set.id} className='flex items-center justify-between'>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            set.color || colors[index % colors.length]
                          }`}
                        >
                          {set.name}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            value === '高'
                              ? 'text-red-600'
                              : value === '中'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                          }`}
                        >
                          {value}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 建議 */}
        <div className='space-y-3'>
          <h4 className='text-md font-medium text-gray-800'>選擇建議</h4>
          <div className='space-y-2'>
            {parameterSets.map((set, index) => {
              const performance = getPerformanceComparison(set)
              let recommendation = ''

              if (performance.creativity === '高' && performance.cost === '高') {
                recommendation = '適合創意寫作，但成本較高'
              } else if (performance.consistency === '高' && performance.cost === '低') {
                recommendation = '適合問答和事實查詢，經濟實惠'
              } else if (performance.creativity === '中' && performance.consistency === '中') {
                recommendation = '平衡設定，適合一般用途'
              } else {
                recommendation = '自定義設定，請根據需求選擇'
              }

              return (
                <div
                  key={set.id}
                  className={`p-3 rounded-lg border ${set.color || colors[index % colors.length]}`}
                >
                  <div className='flex items-center justify-between'>
                    <span className='font-medium'>{set.name}</span>
                    <span className='text-sm'>{recommendation}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 差異摘要 */}
        <div className='bg-gray-50 rounded-lg p-4'>
          <h5 className='text-sm font-medium text-gray-700 mb-2'>差異摘要</h5>
          <div className='text-sm text-gray-600'>
            {(() => {
              const differentParams = definitions.filter(def =>
                getValueDifference(
                  def,
                  parameterSets.map(set => set.values[def.key])
                )
              )

              if (differentParams.length === 0) {
                return '所有參數設定相同'
              }

              return `${differentParams.length} 個參數有差異: ${differentParams
                .map(p => p.key)
                .join(', ')}`
            })()}
          </div>
        </div>
      </div>
    </Card>
  )
}
