import React from 'react';
import { ParameterDefinition } from '../../types';

interface ParameterInputProps {
  definition: ParameterDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const ParameterInput: React.FC<ParameterInputProps> = ({
  definition,
  value,
  onChange,
  error,
  disabled = false,
  className = '',
}) => {
  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md transition-colors
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-red-500' : 'border-gray-300'}
    ${className}
  `;

  const renderInput = () => {
    switch (definition.type) {
      case 'number':
        return (
          <div className="space-y-2">
            <input
              type="number"
              value={value ?? definition.defaultValue ?? ''}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              min={definition.min}
              max={definition.max}
              step={definition.key === 'temperature' ? 0.1 : 1}
              disabled={disabled}
              className={baseInputClasses}
              placeholder={`預設值: ${definition.defaultValue}`}
            />
            {(definition.min !== undefined || definition.max !== undefined) && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>最小值: {definition.min ?? '無限制'}</span>
                <span>最大值: {definition.max ?? '無限制'}</span>
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <select
            value={value ?? definition.defaultValue ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
          >
            {definition.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value ?? definition.defaultValue ?? false}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {value ? '啟用' : '停用'}
            </span>
          </div>
        );

      case 'string':
      default:
        return (
          <input
            type="text"
            value={value ?? definition.defaultValue ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={baseInputClasses}
            placeholder={`預設值: ${definition.defaultValue || '無'}`}
            maxLength={definition.max}
            minLength={definition.min}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {definition.key}
        {definition.defaultValue !== undefined && (
          <span className="ml-1 text-xs text-gray-500">
            (預設: {definition.defaultValue})
          </span>
        )}
      </label>
      
      {renderInput()}
      
      {definition.description && (
        <p className="text-xs text-gray-600">{definition.description}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};