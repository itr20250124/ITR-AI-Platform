import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Modal, ModalHeader, ModalContent, ModalFooter } from './ui';
import { Save, Trash2, Plus, Settings } from 'lucide-react';

interface ParameterPreset {
  id: string;
  name: string;
  description?: string;
  parameters: Record<string, any>;
  createdAt: Date;
}

interface ParameterPresetsProps {
  presets: ParameterPreset[];
  currentParameters: Record<string, any>;
  onLoadPreset: (parameters: Record<string, any>) => void;
  onSavePreset: (name: string, description: string, parameters: Record<string, any>) => void;
  onDeletePreset: (presetId: string) => void;
  className?: string;
}

export const ParameterPresets: React.FC<ParameterPresetsProps> = ({
  presets,
  currentParameters,
  onLoadPreset,
  onSavePreset,
  onDeletePreset,
  className = '',
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim(), presetDescription.trim(), currentParameters);
      setPresetName('');
      setPresetDescription('');
      setShowSaveModal(false);
    }
  };

  const handleLoadPreset = (preset: ParameterPreset) => {
    onLoadPreset(preset.parameters);
    setSelectedPreset(preset.id);
  };

  const handleDeletePreset = (presetId: string) => {
    if (window.confirm('確定要刪除這個預設值嗎？')) {
      onDeletePreset(presetId);
      if (selectedPreset === presetId) {
        setSelectedPreset(null);
      }
    }
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <h3 className="text-lg font-semibold">參數預設值</h3>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowSaveModal(true)}
              className="flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>保存預設值</span>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {presets.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>還沒有保存的參數預設值</p>
              <p className="text-sm mt-2">
                調整參數後點擊「保存預設值」來創建第一個預設值
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`
                    p-4 border rounded-lg cursor-pointer
                    transition-all duration-200
                    ${selectedPreset === preset.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                  onClick={() => handleLoadPreset(preset)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {preset.name}
                      </h4>
                      {preset.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {preset.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {Object.keys(preset.parameters).length} 個參數
                        </span>
                        <span>
                          {new Date(preset.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(preset.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {selectedPreset === preset.id && (
                    <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-800">
                      <div className="text-xs text-primary-700 dark:text-primary-300">
                        <div className="font-medium mb-2">參數預覽:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(preset.parameters).slice(0, 6).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="truncate">{key}:</span>
                              <span className="font-mono text-xs">
                                {typeof value === 'string' ? `"${value}"` : String(value)}
                              </span>
                            </div>
                          ))}
                          {Object.keys(preset.parameters).length > 6 && (
                            <div className="col-span-2 text-center text-primary-600 dark:text-primary-400">
                              還有 {Object.keys(preset.parameters).length - 6} 個參數...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 保存預設值對話框 */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title="保存參數預設值"
      >
        <ModalContent>
          <div className="space-y-4">
            <Input
              label="預設值名稱"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="例如：高創造性設定"
              fullWidth
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                描述 (可選)
              </label>
              <textarea
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="描述這個預設值的用途..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                將保存的參數:
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {Object.entries(currentParameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span className="font-mono">
                      {typeof value === 'string' ? `"${value}"` : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalContent>
        
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => setShowSaveModal(false)}
          >
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleSavePreset}
            disabled={!presetName.trim()}
            className="flex items-center space-x-1"
          >
            <Save className="w-4 h-4" />
            <span>保存</span>
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};