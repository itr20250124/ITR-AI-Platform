import React from 'react'
import { ParameterDefinition } from '../../types'

interface ParameterSliderProps {
  definition: ParameterDefinition
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  showValue?: boolean
  className?: string
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  definition,
  value,
  onChange,
  disabled = false,
  showValue = true,
  className = '',
}) => {
  if (definition.type !== 'number') {
    return null
  }

  const min = definition.min ?? 0
  const max = definition.max ?? 100
  const step = definition.key === 'temperature' ? 0.01 : definition.key.includes('Token') ? 1 : 0.1

  const percentage = ((value - min) / (max - min)) * 100

  const getSliderColor = () => {
    if (definition.key === 'temperature') {
      // 溫度：藍色(低) -> 綠色(中) -> 紅色(高)
      if (percentage < 50) {
        return `linear-gradient(90deg, #3B82F6 0%, #10B981 ${percentage * 2}%)`
      } else {
        return `linear-gradient(90deg, #10B981 0%, #EF4444 ${(percentage - 50) * 2}%)`
      }
    } else if (definition.key.includes('Token')) {
      // Token數量：綠色 -> 黃色 -> 紅色
      if (percentage < 33) {
        return '#10B981' // 綠色
      } else if (percentage < 66) {
        return '#F59E0B' // 黃色
      } else {
        return '#EF4444' // 紅色
      }
    } else {
      // 預設：藍色漸變
      return '#3B82F6'
    }
  }

  const formatValue = (val: number) => {
    if (definition.key === 'temperature') {
      return val.toFixed(2)
    } else if (definition.key.includes('Token')) {
      return Math.round(val).toLocaleString()
    } else {
      return val.toString()
    }
  }

  const getValueDescription = () => {
    if (definition.key === 'temperature') {
      if (value < 0.3) return '保守 (重複性高)'
      if (value < 0.7) return '平衡'
      if (value < 1.2) return '創意'
      return '非常創意 (可能不連貫)'
    } else if (definition.key.includes('Token')) {
      if (percentage < 33) return '經濟'
      if (percentage < 66) return '標準'
      return '大量 (昂貴)'
    }
    return ''
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className='flex justify-between items-center'>
        <label className='block text-sm font-medium text-gray-700'>{definition.key}</label>
        {showValue && (
          <div className='text-right'>
            <span className='text-sm font-mono text-gray-900'>{formatValue(value)}</span>
            {getValueDescription() && (
              <div className='text-xs text-gray-500'>{getValueDescription()}</div>
            )}
          </div>
        )}
      </div>

      <div className='relative'>
        <input
          type='range'
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
          style={{
            background: `linear-gradient(90deg, ${getSliderColor()} ${percentage}%, #E5E7EB ${percentage}%)`,
          }}
        />

        {/* 刻度標記 */}
        <div className='flex justify-between text-xs text-gray-400 mt-1'>
          <span>{min}</span>
          {definition.defaultValue !== undefined && (
            <span className='text-blue-500'>預設: {formatValue(definition.defaultValue)}</span>
          )}
          <span>{max}</span>
        </div>
      </div>

      {definition.description && <p className='text-xs text-gray-600'>{definition.description}</p>}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid ${getSliderColor()};
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid ${getSliderColor()};
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .slider:disabled::-webkit-slider-thumb {
          cursor: not-allowed;
        }

        .slider:disabled::-moz-range-thumb {
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
