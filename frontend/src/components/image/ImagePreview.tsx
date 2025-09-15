import React from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ImageResponse } from '../../services/imageService';

interface ImagePreviewProps {
  image: ImageResponse;
  onDownload?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
  onClick?: () => void;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  onDownload,
  onDelete,
  onRegenerate,
  onClick,
  className = '',
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'generation': return '生成';
      case 'variation': return '變體';
      case 'edit': return '編輯';
      default: return '圖片';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'generation': return 'bg-green-100 text-green-800';
      case 'variation': return 'bg-blue-100 text-blue-800';
      case 'edit': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow ${className}`}>
      <div className="relative group" onClick={onClick}>
        <img
          src={image.imageUrl}
          alt={image.prompt || 'Generated image'}
          className="w-full h-48 object-cover cursor-pointer"
          loading="lazy"
        />
        
        {/* 懸停時顯示的操作按鈕 */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center space-x-2">
            {onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </Button>
            )}
            
            {onRegenerate && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate();
                }}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
            )}
            
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="bg-white text-red-600 hover:bg-red-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        </div>

        {/* 類型標籤 */}
        {image.metadata?.type && (
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(image.metadata.type)}`}>
              {getTypeLabel(image.metadata.type)}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* 提示詞 */}
        {image.prompt && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2" title={image.prompt}>
            {image.prompt}
          </p>
        )}

        {/* 元數據 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            {image.metadata?.model && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {image.metadata.model}
              </span>
            )}
            {image.metadata?.size && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {image.metadata.size}
              </span>
            )}
          </div>
          
          <time dateTime={image.createdAt} title={image.createdAt}>
            {formatDate(image.createdAt)}
          </time>
        </div>
      </div>
    </Card>
  );
};