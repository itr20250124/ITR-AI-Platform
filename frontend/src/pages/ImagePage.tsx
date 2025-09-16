import React, { useState } from 'react'
import { ImageGenerator } from '../components/image/ImageGenerator'
import { ImageEditor } from '../components/image/ImageEditor'
import { ImageHistory } from '../components/image/ImageHistory'
import { ImageResponse } from '../services/imageService'

export const ImagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'edit' | 'history'>('generate')
  const [selectedImage, setSelectedImage] = useState<ImageResponse | null>(null)

  // 處理圖片生成完成
  const handleImageGenerated = (image: ImageResponse) => {
    // 可以在這裡添加額外的處理邏輯，比如更新歷史列表
    console.log('圖片生成完成:', image)
  }

  // 處理圖片處理完成
  const handleImageProcessed = (image: ImageResponse) => {
    // 可以在這裡添加額外的處理邏輯
    console.log('圖片處理完成:', image)
  }

  // 處理從歷史中選擇圖片
  const handleImageSelect = (image: ImageResponse) => {
    setSelectedImage(image)
    // 可以根據需要切換到相應的標籤頁
  }

  // 標籤頁配置
  const tabs = [
    {
      id: 'generate' as const,
      label: '圖片生成',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      ),
      description: '使用AI生成全新的圖片',
    },
    {
      id: 'edit' as const,
      label: '圖片編輯',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
          />
        </svg>
      ),
      description: '編輯現有圖片或創建變體',
    },
    {
      id: 'history' as const,
      label: '圖片歷史',
      icon: (
        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      ),
      description: '查看和管理生成的圖片',
    },
  ]

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* 頁面標題 */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='py-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>AI 圖片工作室</h1>
                <p className='text-gray-600 mt-1'>使用先進的AI技術生成、編輯和管理您的圖片</p>
              </div>

              {/* 快速統計（可選） */}
              <div className='hidden md:flex items-center space-x-6 text-sm text-gray-600'>
                <div className='text-center'>
                  <div className='text-lg font-semibold text-gray-900'>--</div>
                  <div>今日生成</div>
                </div>
                <div className='text-center'>
                  <div className='text-lg font-semibold text-gray-900'>--</div>
                  <div>總計圖片</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 標籤頁導航 */}
      <div className='bg-white border-b border-gray-200'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <nav className='flex space-x-8' aria-label='Tabs'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span
                  className={`mr-2 ${
                    activeTab === tab.id
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 標籤頁內容 */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* 標籤頁描述 */}
        <div className='mb-6'>
          <p className='text-gray-600'>{tabs.find(tab => tab.id === activeTab)?.description}</p>
        </div>

        {/* 內容區域 */}
        <div className='space-y-6'>
          {activeTab === 'generate' && (
            <ImageGenerator onImageGenerated={handleImageGenerated} className='max-w-4xl' />
          )}

          {activeTab === 'edit' && (
            <ImageEditor onImageProcessed={handleImageProcessed} className='max-w-4xl' />
          )}

          {activeTab === 'history' && <ImageHistory onImageSelect={handleImageSelect} />}
        </div>

        {/* 選中的圖片信息（如果有） */}
        {selectedImage && (
          <div className='fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm'>
            <div className='flex items-center justify-between mb-2'>
              <h4 className='font-medium text-gray-900'>選中的圖片</h4>
              <button
                onClick={() => setSelectedImage(null)}
                className='text-gray-400 hover:text-gray-600'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>
            <div className='space-y-2'>
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.prompt}
                className='w-full h-24 object-cover rounded'
              />
              <p className='text-sm text-gray-600 line-clamp-2'>{selectedImage.prompt}</p>
              <div className='flex items-center space-x-2'>
                <button
                  onClick={() => {
                    setActiveTab('edit')
                    // 這裡可以將選中的圖片傳遞給編輯組件
                  }}
                  className='text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600'
                >
                  編輯
                </button>
                <button
                  onClick={() => {
                    // 下載圖片
                    const link = document.createElement('a')
                    link.href = selectedImage.imageUrl
                    link.download = `image-${selectedImage.id}.png`
                    link.click()
                  }}
                  className='text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600'
                >
                  下載
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 快捷鍵提示（可選） */}
      <div className='fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded-lg opacity-0 hover:opacity-100 transition-opacity'>
        <div className='space-y-1'>
          <div>
            <kbd className='bg-gray-700 px-1 rounded'>G</kbd> 圖片生成
          </div>
          <div>
            <kbd className='bg-gray-700 px-1 rounded'>E</kbd> 圖片編輯
          </div>
          <div>
            <kbd className='bg-gray-700 px-1 rounded'>H</kbd> 圖片歷史
          </div>
        </div>
      </div>
    </div>
  )
}

// 添加鍵盤快捷鍵支持
export const useImagePageKeyboard = (
  setActiveTab: (tab: 'generate' | 'edit' | 'history') => void
) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return

      switch (e.key.toLowerCase()) {
        case 'g':
          setActiveTab('generate')
          break
        case 'e':
          setActiveTab('edit')
          break
        case 'h':
          setActiveTab('history')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setActiveTab])
}
