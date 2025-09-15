import React, { useState, useEffect } from 'react';
import { ParameterDefinition } from '../types';
import { Input, Button, Card, CardHeader, CardContent } from './ui';
import { Settings, RotateCcw, Check, AlertCircle } from 'lucide-react';

interface ParameterControlProps {
  parameters: ParameterDefinition[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
  onReset?: () => void;
  onValidate?: () => void;
  validationErrors?: Array<{ field: string; message: string }>;
  className?: string;
}

export const ParameterControl: React.FC<ParameterControlProps> = ({
  parameters,
  values,
  onChange,
  onReset,
  onValidate,
  validationErrors = [],
  className = '',
}) => {
  const [localValues, setLocalValues] = useState<Record<string, any>>(values);

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  const handleValueChange = (key: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
    onChange(key, value);
  };

  const getValidationError = (field: string) => {
    return validationErrors.find(error => error.field === field)?.message;
  };

  const renderParameterInput = (param: ParameterDefinition) => {
    const value = localValues[param.key];
    const error = getValidationError(param.key);

    switch (param.type) {
      case 'number':
        return (
          <div key={param.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {param.key}
              {param.description && (
                <span className="text-xs text-gray-500 ml-2">
                  ({param.description})
                </span>
              )}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={param.min || 0}
                max={param.max || 100}
                step={param.type === 'number' ? 0.1 : 1}
                value={value || param.defaultValue || 0}
                onChange={(e) => handleValueChange(param.key, parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <Input
                type="number"
                min={param.min}
                max={param.max}
                step={param.type === 'number' ? 0.1 : 1}
                value={value || param.defaultValue || 0}
                onChange={(e) => handleValueChange(param.key, parseFloat(e.target.value))}
                className="w-20"
                error={error}
              />
            </div>
            {(param.min !== undefined || param.max !== undefined) && (
              <div className="flex justify-between text-xs text-gray-500">
                <span>{param.min || 0}</span>
                <span>{param.max || 100}</span>
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={param.key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {param.key}
              {param.description && (
                <span className="text-xs text-gray-500 ml-2">
                  ({param.description})
                </span>
              )}
            </label>
            <select
              value={value || param.defaultValue || ''}
              onChange={(e) => handleValueChange(param.key, e.target.value)}
              className={`
                w-full px-3 py-2 border rounded-lg
                bg-white dark:bg-gray-800
                text-gray-900 dark:text-gray-100
                border-gray-300 dark:border-gray-600
                focus:ring-2 focus:ring-primary-500 focus:border-transparent
                ${error ? 'border-red-500' : ''}
              `}
            >
              {param.options?.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={param.key} className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={value !== undefined ? value : param.defaultValue || false}
                onChange={(e) => handleValueChange(param.key, e.target.checked)}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {param.key}
                {param.description && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({param.description})
                  </span>
                )}
              </span>
            </label>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>
        );

      case 'string':
      default:
        return (
          <div key={param.key} className="space-y-2">
            <Input
              label={param.key}
              helperText={param.description}
              value={value || param.defaultValue || ''}
              onChange={(e) => handleValueChange(param.key, e.target.value)}
              error={error}
              fullWidth
            />
          </div>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <h3 className="text-lg font-semibold">參數設定</h3>
          </div>
          <div className="flex items-center space-x-2">
            {onValidate && (
              <Button
                variant="outline"
                size="sm"
                onClick={onValidate}
                className="flex items-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>驗證</span>
              </Button>
            )}
            {onReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="flex items-center space-x-1"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重置</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {parameters.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            沒有可用的參數設定
          </div>
        ) : (
          <div className="space-y-6">
            {parameters.map(renderParameterInput)}
            
            {validationErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    參數驗證錯誤
                  </span>
                </div>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>
                      {error.field}: {error.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};