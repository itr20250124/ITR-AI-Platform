import React, { useState } from 'react';
import { ParameterDefinition } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ParameterHistoryEntry {
  id: string;
  timestamp: Date;
  values: Record<string, any>;
  description?: string;
  source: 'manual' | 'preset' | 'auto';
}

interface ParameterHistoryProps {
  definitions: ParameterDefinition[];
  history: ParameterHistoryEntry[];
  currentValues: Record<string, any>;
  onRestore: (values: Record<string, any>) => void;
  onClear?: () => void;
  className?: string;
}

export const ParameterHistory: React.FC<ParameterHistoryProps> = ({
  definitions,
  history,
  currentValues,
  onRestore,
  onClear,
  className = '',
}) => {
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'manual': return '✏️';
      case 'preset': return '📋';
      case 'auto': return '🤖';
      default: return '📝';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'manual': return '手動設定';
      case 'preset': return '預設配置';
      case 'auto': return '自動調整';
      default: return '未知';
    }
  };

  const compareWithCurrent = (historyValues: Record<string, any>) => {
    const differences: Array<{
      key: string;
      current: any;
      history: any;
      type: 'added' | 'removed' | 'changed';
    }> = [];

    const allKeys = new Set([
      ...Object.keys(currentValues),
      ...Object.keys(historyValues),
    ]);

    for (const key of allKeys) {
      const currentValue = currentValues[key];
      const historyValue = historyValues[key];

      if (currentValue === undefined && historyValue !== undefined) {
        differences.push({ key, current: currentValue, history: historyValue, type: 'removed' });
      } else if (currentValue !== undefined && historyValue === undefined) {
        differences.push({ key, current: currentValue, history: historyValue, type: 'added' });
      } else if (currentValue !== historyValue) {
        differences.push({ key, current: currentValue, history: historyValue, type: 'changed' });
      }
    }

    return differences;
  };

  const formatValue = (definition: ParameterDefinition | undefined, value: any) => {
    if (value === undefined || value === null) {
      return '未設定';
    }

    if (definition?.type === 'number') {
      if (definition.key === 'temperature') {
        return Number(value).toFixed(2);
      } else if (definition.key.includes('Token')) {
        return Number(value).toLocaleString();
      }
    }

    return String(value);
  };

  if (history.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">📚</div>
          <p>尚無參數變更歷史</p>
          <p className="text-sm mt-1">當您修改參數時，變更記錄會顯示在這裡</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">參數歷史</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDiff(!showDiff)}
            >
              {showDiff ? '隱藏差異' : '顯示差異'}
            </Button>
            {onClear && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClear}
                className="text-red-600 hover:text-red-700"
              >
                清除歷史
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {history.map((entry, index) => {
            const isSelected = selectedEntry === entry.id;
            const differences = compareWithCurrent(entry.values);
            const isLatest = index === 0;

            return (
              <div
                key={entry.id}
                className={`border rounded-lg p-4 transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${isLatest ? 'ring-2 ring-green-200' : ''}`}
                onClick={() => setSelectedEntry(isSelected ? null : entry.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getSourceIcon(entry.source)}</span>
                      <span className="font-medium text-gray-900">
                        {entry.description || `參數變更 #${history.length - index}`}
                      </span>
                      {isLatest && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          最新
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                      <span>{formatTimestamp(entry.timestamp)}</span>
                      <span>{getSourceLabel(entry.source)}</span>
                      {differences.length > 0 && (
                        <span className="text-orange-600">
                          {differences.length} 個差異
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestore(entry.values);
                    }}
                    disabled={isLatest}
                  >
                    {isLatest ? '當前' : '恢復'}
                  </Button>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {showDiff && differences.length > 0 ? (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">與當前設定的差異</h5>
                        <div className="space-y-1">
                          {differences.map((diff) => {
                            const definition = definitions.find(d => d.key === diff.key);
                            return (
                              <div key={diff.key} className="flex justify-between items-center text-sm">
                                <span className="font-medium">{diff.key}</span>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    diff.type === 'added' ? 'bg-green-100 text-green-800' :
                                    diff.type === 'removed' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {diff.type === 'added' ? '新增' :
                                     diff.type === 'removed' ? '移除' : '變更'}
                                  </span>
                                  <span className="font-mono">
                                    {formatValue(definition, diff.history)}
                                    {diff.type === 'changed' && (
                                      <>
                                        {' → '}
                                        {formatValue(definition, diff.current)}
                                      </>
                                    )}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">參數設定</h5>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(entry.values).map(([key, value]) => {
                            const definition = definitions.find(d => d.key === key);
                            return (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600">{key}:</span>
                                <span className="font-mono">
                                  {formatValue(definition, value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 統計信息 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{history.length}</div>
              <div className="text-sm text-gray-600">總變更次數</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {history.filter(h => h.source === 'manual').length}
              </div>
              <div className="text-sm text-gray-600">手動變更</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {history.filter(h => h.source === 'preset').length}
              </div>
              <div className="text-sm text-gray-600">預設配置</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};