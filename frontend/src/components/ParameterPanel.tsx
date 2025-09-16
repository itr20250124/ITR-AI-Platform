import React, { useState, useEffect } from 'react';
import { ParameterDefinition } from '../types';
import { ParameterService } from '../services/parameterService';
import { AIServiceSelector } from './AIServiceSelector';
import { ParameterControl } from './ParameterControl';
import { ParameterPresets } from './ParameterPresets';
import { Card, CardHeader, CardContent, Loading } from './ui';
import { Sliders } from 'lucide-react';

interface ParameterPanelProps {
  serviceType: 'chat' | 'image' | 'video';
  selectedProvider: string;
  parameters: Record<string, any>;
  onProviderChange: (provider: string) => void;
  onParametersChange: (parameters: Record<string, any>) => void;
  className?: string;
}

interface ParameterPreset {
  id: string;
  name: string;
  description?: string;
  parameters: Record<string, any>;
  createdAt: Date;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  serviceType,
  selectedProvider,
  parameters,
  onProviderChange,
  onParametersChange,
  className = '',
}) => {
  const [parameterDefinitions, setParameterDefinitions] = useState<ParameterDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Array<{ field: string; message: string }>
  >([]);
  const [presets, setPresets] = useState<ParameterPreset[]>([]);

  // 載入參數定義
  useEffect(() => {
    if (selectedProvider) {
      loadParameterDefinitions();
    }
  }, [selectedProvider, serviceType]);

  // 載入預設值
  useEffect(() => {
    loadPresets();
  }, [serviceType]);

  const loadParameterDefinitions = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await ParameterService.getProviderParameters(selectedProvider, serviceType);
      setParameterDefinitions(data.parameters);

      // 如果當前參數為空，載入預設值
      if (Object.keys(parameters).length === 0) {
        const defaults = await ParameterService.getParameterDefaults(selectedProvider, serviceType);
        onParametersChange(defaults.defaults);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入參數定義失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadPresets = () => {
    // 從localStorage載入預設值
    const storageKey = `parameter-presets-${serviceType}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setPresets(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to load presets:', err);
      }
    }
  };

  const savePresets = (newPresets: ParameterPreset[]) => {
    const storageKey = `parameter-presets-${serviceType}`;
    localStorage.setItem(storageKey, JSON.stringify(newPresets));
    setPresets(newPresets);
  };

  const handleParameterChange = (key: string, value: any) => {
    const newParameters = { ...parameters, [key]: value };
    onParametersChange(newParameters);

    // 清除該字段的驗證錯誤
    setValidationErrors(prev => prev.filter(error => error.field !== key));
  };

  const handleValidateParameters = async () => {
    try {
      const result = await ParameterService.validateParameters(
        selectedProvider,
        serviceType,
        parameters
      );

      if (result.isValid) {
        setValidationErrors([]);
        // 可以顯示成功提示
      } else {
        setValidationErrors(result.errors || []);
      }
    } catch (err) {
      setValidationErrors([
        { field: 'general', message: err instanceof Error ? err.message : '驗證失敗' },
      ]);
    }
  };

  const handleResetParameters = async () => {
    try {
      const defaults = await ParameterService.getParameterDefaults(selectedProvider, serviceType);
      onParametersChange(defaults.defaults);
      setValidationErrors([]);
    } catch (err) {
      console.error('Failed to reset parameters:', err);
    }
  };

  const handleSavePreset = (name: string, description: string, params: Record<string, any>) => {
    const newPreset: ParameterPreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      parameters: params,
      createdAt: new Date(),
    };

    const newPresets = [...presets, newPreset];
    savePresets(newPresets);
  };

  const handleDeletePreset = (presetId: string) => {
    const newPresets = presets.filter(preset => preset.id !== presetId);
    savePresets(newPresets);
  };

  const handleLoadPreset = (presetParameters: Record<string, any>) => {
    onParametersChange(presetParameters);
    setValidationErrors([]);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <Loading text='載入參數設定...' />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI服務選擇器 */}
      <AIServiceSelector
        selectedService={selectedProvider}
        serviceType={serviceType}
        onServiceChange={onProviderChange}
      />

      {/* 參數控制 */}
      {selectedProvider && (
        <ParameterControl
          parameters={parameterDefinitions}
          values={parameters}
          onChange={handleParameterChange}
          onReset={handleResetParameters}
          onValidate={handleValidateParameters}
          validationErrors={validationErrors}
        />
      )}

      {/* 參數預設值 */}
      <ParameterPresets
        presets={presets}
        currentParameters={parameters}
        onLoadPreset={handleLoadPreset}
        onSavePreset={handleSavePreset}
        onDeletePreset={handleDeletePreset}
      />

      {error && (
        <Card variant='outlined'>
          <CardContent className='p-4'>
            <div className='text-red-600 dark:text-red-400 text-center'>{error}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
