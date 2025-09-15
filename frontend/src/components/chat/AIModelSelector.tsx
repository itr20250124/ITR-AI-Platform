import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { ParameterPanel } from '../parameters/ParameterPanel';

interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  parameters: Array<{
    key: string;
    type: 'number' | 'string' | 'boolean' | 'select';
    defaultValue: any;
    min?: number;
    max?: number;
    options?: string[];
    description: string;
  }>;
}

interface AIModelSelectorProps {
  currentProvider: string;
  currentParameters: Record<string, any>;
  onModelChange: (provider: string, parameters?: Record<string, any>) => void;
  className?: string;
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  currentProvider,
  currentParameters,
  onModelChange,
  className = '',
}) => {
  const [showSelector, setShowSelector] = useState(false);
  const [showParameters, setShowParameters] = useState(false);

  // 可用的AI模型
  const availableModels: AIModel[] = [
    {
      id: 'openai',
      name: 'OpenAI GPT',
      provider: 'openai',
      description: '強大的對話AI，適合各種任務',
      icon: '🤖',
      parameters: [
        {
          key: 'model',
          type: 'select',
          defaultValue: 'gpt-3.5-turbo',
          options: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
          description: '選擇GPT模型',
        },
        {
          key: 'temperature',
          type: 'number',
          defaultValue: 0.7,
          min: 0,
          max: 2,
          description: '控制回應的創造性',
        },
        {
          key: 'maxTokens',
          type: 'number',
          defaultValue: 1000,
          min: 1,
          max: 4000,
          description: '最大回應長度',
        },
      ],
    },
    {
      id: 'gemini',
      name: 'Google Gemini',
      provider: 'gemini',
      description: 'Google的先進AI模型，支持多模態',
      icon: '✨',
      parameters: [
        {
          key: 'model',
          type: 'select',
          defaultValue: 'gemini-pro',
          options: ['gemini-pro', 'gemini-pro-vision'],
          description: '選擇Gemini模型',
        },
        {
          key: 'temperature',
          type: 'number',
          defaultValue: 0.9,
          min: 0,
          max: 1,
          description: '控制回應的創造性',
        },
        {
          key: 'maxOutputTokens',
          type: 'number',
          defaultValue: 2048,
          min: 1,
          max: 8192,
          description: '最大輸出token數',
        },
      ],
    },
  ];

  const currentModel = availableModels.find(m => m.provider === currentProvider);

  const handleModelSelect = (model: AIModel) => {
    if (model.provider !== currentProvider) {
      // 切換到新模型時使用預設參數
      const defaultParams: Record<string, any> = {};
      model.parameters.forEach(param => {
        defaultParams[param.key] = param.defaultValue;
      });
      onModelChange(model.provider, defaultParams);
    }
    setShowSelector(false);
  };

  const handleParametersChange = (parameters: Record<string, any>) => {
    onModelChange(currentProvider, parameters);
  };

  return (
    <div className={`relative ${className}`}>
      {/* 當前模型顯示 */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSelector(!showSelector)}
          className="flex items-center space-x-2"
        >
          <span>{currentModel?.icon}</span>
          <span>{currentModel?.name}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {/* 參數設定按鈕 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowParameters(!showParameters)}
          className="text-gray-600 hover:text-gray-800"
          title="參數設定"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Button>
      </div>

      {/* 模型選擇下拉菜單 */}
      {showSelector && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">選擇AI模型</h3>
            <div className="space-y-2">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    model.provider === currentProvider
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{model.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{model.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{model.description}</div>
                    </div>
                    {model.provider === currentProvider && (
                      <div className="text-blue-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 參數設定面板 */}
      {showParameters && currentModel && (
        <div className="absolute top-full right-0 mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">
                {currentModel.name} 參數設定
              </h3>
              <button
                onClick={() => setShowParameters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <ParameterPanel
              provider={currentModel.provider}
              definitions={currentModel.parameters}
              values={currentParameters}
              onChange={handleParametersChange}
              showPresets={false}
              showAdvanced={false}
              className="border-0 p-0"
            />
          </div>
        </div>
      )}

      {/* 點擊外部關閉 */}
      {(showSelector || showParameters) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => {
            setShowSelector(false);
            setShowParameters(false);
          }}
        />
      )}
    </div>
  );
};