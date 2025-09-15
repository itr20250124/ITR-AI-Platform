import React, { useState, useEffect } from 'react';
import { ImageService, ImageResponse, ImageHistory as ImageHistoryType } from '../../services/imageService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ImagePreview } from './ImagePreview';
import { toast } from 'react-hot-toast';

interface ImageHistoryProps {
  onImageSelect?: (image: ImageResponse) => void;
  className?: string;
}

export const ImageHistory: React.FC<ImageHistoryProps> = ({
  onImageSelect,
  className = '',
}) => {
  const [history, setHistory] = useState<ImageHistoryType>({ images: [], total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'generation' | 'variation' | 'edit'>('all');
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const itemsPerPage = 12;

  // 載入圖片歷史
  const loadHistory = async (page: number = 1, type?: string) => {
    try {
      setIsLoading(true);
      const options = {
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        ...(type && type !== 'all' && { type: type as any }),
      };

      const result = await ImageService.getImageHistory(options);
      setHistory(result);
    } catch (error) {
      console.error('載入圖片歷史失敗:', error);
      toast.error('載入圖片歷史失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    loadHistory(1, filter);
  }, [filter]);

  // 處理頁面變更
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadHistory(page, filter);
  };

  // 處理篩選變更
  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // 處理圖片選擇
  const handleImageToggle = (imageId: string) => {
    const newSelected = new Set(selectedImages);
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId);
    } else {
      newSelected.add(imageId);
    }
    setSelectedImages(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // 全選/取消全選
  const handleSelectAll = () => {
    if (selectedImages.size === history.images.length) {
      setSelectedImages(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedImages(new Set(history.images.map(img => img.id)));
      setShowBulkActions(true);
    }
  };

  // 批量下載
  const handleBulkDownload = async () => {
    const selectedImagesList = history.images.filter(img => selectedImages.has(img.id));
    
    for (const image of selectedImagesList) {
      try {
        await ImageService.downloadImage(
          image.imageUrl,
          `${image.metadata?.type || 'image'}-${image.id}.png`
        );
      } catch (error) {
        console.error(`下載圖片 ${image.id} 失敗:`, error);
      }
    }
    
    toast.success(`已開始下載 ${selectedImagesList.length} 張圖片`);
  };

  // 批量刪除（這裡假設有刪除API）
  const handleBulkDelete = async () => {
    if (!confirm(`確定要刪除選中的 ${selectedImages.size} 張圖片嗎？`)) {
      return;
    }

    try {
      // 這裡需要實作批量刪除API
      // await ImageService.deleteImages(Array.from(selectedImages));
      
      // 暫時從本地狀態中移除
      const newImages = history.images.filter(img => !selectedImages.has(img.id));
      setHistory(prev => ({
        ...prev,
        images: newImages,
        total: prev.total - selectedImages.size,
      }));
      
      setSelectedImages(new Set());
      setShowBulkActions(false);
      toast.success('圖片已刪除');
    } catch (error) {
      console.error('批量刪除失敗:', error);
      toast.error('刪除失敗');
    }
  };

  // 計算總頁數
  const totalPages = Math.ceil(history.total / itemsPerPage);

  // 獲取篩選器標籤
  const getFilterLabel = (filterType: typeof filter) => {
    switch (filterType) {
      case 'all': return '全部';
      case 'generation': return '生成';
      case 'variation': return '變體';
      case 'edit': return '編輯';
      default: return '全部';
    }
  };

  // 獲取篩選器計數
  const getFilterCount = (filterType: typeof filter) => {
    if (filterType === 'all') return history.total;
    return history.images.filter(img => img.metadata?.type === filterType).length;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 標題和篩選器 */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">圖片歷史</h2>
            <p className="text-sm text-gray-600 mt-1">
              共 {history.total} 張圖片
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* 篩選器 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">篩選:</span>
              <div className="flex items-center space-x-1">
                {(['all', 'generation', 'variation', 'edit'] as const).map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => handleFilterChange(filterType)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      filter === filterType
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getFilterLabel(filterType)}
                  </button>
                ))}
              </div>
            </div>

            {/* 重新整理按鈕 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadHistory(currentPage, filter)}
              disabled={isLoading}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重新整理
            </Button>
          </div>
        </div>

        {/* 批量操作工具列 */}
        {showBulkActions && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                已選擇 {selectedImages.size} 張圖片
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDownload}
                >
                  批量下載
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-800"
                >
                  批量刪除
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedImages(new Set());
                    setShowBulkActions(false);
                  }}
                >
                  取消選擇
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* 圖片網格 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : history.images.length === 0 ? (
        <Card className="p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">沒有圖片</h3>
          <p className="text-gray-600">
            {filter === 'all' ? '還沒有生成任何圖片' : `沒有${getFilterLabel(filter)}類型的圖片`}
          </p>
        </Card>
      ) : (
        <>
          {/* 全選控制 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedImages.size === history.images.length ? '取消全選' : '全選'}
            </button>
            
            <span className="text-sm text-gray-600">
              第 {currentPage} 頁，共 {totalPages} 頁
            </span>
          </div>

          {/* 圖片網格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {history.images.map((image) => (
              <div key={image.id} className="relative">
                {/* 選擇框 */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedImages.has(image.id)}
                    onChange={() => handleImageToggle(image.id)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                <ImagePreview
                  image={image}
                  onDownload={() => {
                    ImageService.downloadImage(
                      image.imageUrl,
                      `${image.metadata?.type || 'image'}-${image.id}.png`
                    );
                  }}
                  onDelete={() => {
                    // 實作單個圖片刪除
                    if (confirm('確定要刪除這張圖片嗎？')) {
                      const newImages = history.images.filter(img => img.id !== image.id);
                      setHistory(prev => ({
                        ...prev,
                        images: newImages,
                        total: prev.total - 1,
                      }));
                      toast.success('圖片已刪除');
                    }
                  }}
                  className={`cursor-pointer transition-all ${
                    selectedImages.has(image.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => onImageSelect?.(image)}
                />
              </div>
            ))}
          </div>

          {/* 分頁控制 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                上一頁
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                下一頁
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};