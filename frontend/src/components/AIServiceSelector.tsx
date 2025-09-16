import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Loading } from './ui';
import { Bot, Image as ImageIcon, Video, ChevronDown } from 'lucide-react';
import { ParameterService, AIProvider } from '../services/parameterService';

interface AIServiceSelectorProps {
  selectedService: string;
  serviceType: 'chat' | 'image' | 'video';
  onServiceChange: (service: string) => void;
  className?: string;
}

export const AIServiceSelector: React.FC<AIServiceSelectorProps> = ({
  selectedService,
  serviceType,
  onServiceChange,
  className = '',
}) => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadProviders();
  }, [serviceType]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await ParameterService.getProvidersByType(serviceType);
      setProviders(data.providers);

      // 如果沒有選中的服務或選中的服務不可用，選擇第一個可用的服務
      if (!selectedService || !data.providers.find(p => p.id === selectedService)) {
        const firstAvailable = data.providers.find(p => p.enabled);
        if (firstAvailable) {
          onServiceChange(firstAvailable.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入服務提供商失敗');
    } finally {
      setLoading(false);
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <Bot className='w-4 h-4' />;
      case 'image':
        return <ImageIcon className='w-4 h-4' />;
      case 'video':
        return <Video className='w-4 h-4' />;
      default:
        return <Bot className='w-4 h-4' />;
    }
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'chat':
        return '聊天服務';
      case 'image':
        return '圖片生成';
      case 'video':
        return '影片生成';
      default:
        return '未知服務';
    }
  };

  const selectedProvider = providers.find(p => p.id === selectedService);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <Loading text='載入服務提供商...' />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className='p-6'>
          <div className='text-center text-red-600 dark:text-red-400'>{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex items-center space-x-2'>
          {getServiceIcon(serviceType)}
          <h3 className='text-lg font-semibold'>{getServiceTypeLabel(serviceType)}</h3>
        </div>
      </CardHeader>

      <CardContent>
        <div className='relative'>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`
              w-full flex items-center justify-between
              px-4 py-3 border rounded-lg
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100
              border-gray-300 dark:border-gray-600
              hover:bg-gray-50 dark:hover:bg-gray-700
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
              transition-colors duration-200
            `}
          >
            <div className='flex items-center space-x-3'>
              {selectedProvider && (
                <>
                  <div
                    className={`
                    w-3 h-3 rounded-full
                    ${selectedProvider.enabled ? 'bg-green-500' : 'bg-red-500'}
                  `}
                  />
                  <span className='font-medium'>{selectedProvider.name}</span>
                </>
              )}
              {!selectedProvider && <span className='text-gray-500'>選擇服務提供商</span>}
            </div>
            <ChevronDown
              className={`
              w-4 h-4 transition-transform duration-200
              ${isOpen ? 'transform rotate-180' : ''}
            `}
            />
          </button>

          {isOpen && (
            <div
              className={`
              absolute top-full left-0 right-0 mt-1 z-10
              bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-600
              rounded-lg shadow-lg
              max-h-60 overflow-y-auto
            `}
            >
              {providers.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => {
                    onServiceChange(provider.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3
                    text-left hover:bg-gray-50 dark:hover:bg-gray-700
                    transition-colors duration-200
                    ${selectedService === provider.id ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                  `}
                >
                  <div
                    className={`
                    w-3 h-3 rounded-full
                    ${provider.enabled ? 'bg-green-500' : 'bg-red-500'}
                  `}
                  />
                  <div className='flex-1'>
                    <div className='font-medium text-gray-900 dark:text-gray-100'>
                      {provider.name}
                    </div>
                    <div className='text-sm text-gray-500 dark:text-gray-400'>
                      {provider.supportedParameters.length} 個參數
                      {!provider.enabled && ' (已停用)'}
                    </div>
                  </div>
                </button>
              ))}

              {providers.length === 0 && (
                <div className='px-4 py-3 text-center text-gray-500 dark:text-gray-400'>
                  沒有可用的服務提供商
                </div>
              )}
            </div>
          )}
        </div>

        {selectedProvider && (
          <div className='mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              <div className='flex justify-between items-center mb-2'>
                <span>參數數量:</span>
                <span className='font-medium'>{selectedProvider.supportedParameters.length}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span>狀態:</span>
                <span
                  className={`
                  font-medium
                  ${
                    selectedProvider.enabled
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                `}
                >
                  {selectedProvider.enabled ? '可用' : '已停用'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
