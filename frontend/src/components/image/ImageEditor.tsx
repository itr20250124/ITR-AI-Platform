import React, { useState, useRef } from 'react'
import {
  ImageService,
  ImageVariationRequest,
  ImageEditRequest,
  ImageResponse,
} from '../../services/imageService'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ImagePreview } from './ImagePreview'
import toast from 'react-hot-toast'

interface ImageEditorProps {
  onImageProcessed?: (image: ImageResponse) => void
  className?: string
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ onImageProcessed, className = '' }) => {
  const [mode, setMode] = useState<'variation' | 'edit'>('variation')
  const [sourceImage, setSourceImage] = useState<File | null>(null)
  const [maskImage, setMaskImage] = useState<File | null>(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImage, setProcessedImage] = useState<ImageResponse | null>(null)
  const [sourcePreview, setSourcePreview] = useState<string>('')
  const [maskPreview, setMaskPreview] = useState<string>('')

  const sourceInputRef = useRef<HTMLInputElement>(null)
  const maskInputRef = useRef<HTMLInputElement>(null)

  // 處理圖片選擇
  const handleImageSelect = async (file: File, type: 'source' | 'mask') => {
    const validation = ImageService.validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error!)
      return
    }

    try {
      // 壓縮圖片
      const compressedFile = await ImageService.compressImage(file)

      if (type === 'source') {
        setSourceImage(compressedFile)
        const preview = await ImageService.getImageAsBase64(compressedFile)
        setSourcePreview(preview)
      } else {
        setMaskImage(compressedFile)
        const preview = await ImageService.getImageAsBase64(compressedFile)
        setMaskPreview(preview)
      }
    } catch (error) {
      toast.error('圖片處理失敗')
    }
  }

  // 處理文件拖放
  const handleDrop = (e: React.DragEvent, type: 'source' | 'mask') => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))

    if (imageFile) {
      handleImageSelect(imageFile, type)
    } else {
      toast.error('請選擇圖片文件')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // 處理圖片變體生成
  const handleCreateVariation = async () => {
    if (!sourceImage) {
      toast.error('請先選擇原始圖片')
      return
    }

    try {
      setIsProcessing(true)
      setProcessedImage(null)

      const request: ImageVariationRequest = {
        imageFile: sourceImage,
        provider: 'openai',
        parameters: {
          n: 1,
          size: '1024x1024',
        },
      }

      const imageService = new ImageService()
      const result = await imageService.createImageVariation(request)
      setProcessedImage(result)
      onImageProcessed?.(result)
      toast.success('圖片變體生成成功！')
    } catch (error) {
      console.error('圖片變體生成失敗:', error)
      toast.error(error instanceof Error ? error.message : '圖片變體生成失敗')
    } finally {
      setIsProcessing(false)
    }
  }

  // 處理圖片編輯
  const handleEditImage = async () => {
    if (!sourceImage) {
      toast.error('請先選擇原始圖片')
      return
    }

    if (!maskImage) {
      toast.error('請選擇遮罩圖片')
      return
    }

    if (!editPrompt.trim()) {
      toast.error('請輸入編輯描述')
      return
    }

    try {
      setIsProcessing(true)
      setProcessedImage(null)

      const request: ImageEditRequest = {
        imageFile: sourceImage,
        maskFile: maskImage,
        prompt: editPrompt.trim(),
        provider: 'openai',
        parameters: {
          n: 1,
          size: '1024x1024',
        },
      }

      const imageService = new ImageService()
      const result = await imageService.editImage(request)
      setProcessedImage(result)
      onImageProcessed?.(result)
      toast.success('圖片編輯成功！')
    } catch (error) {
      console.error('圖片編輯失敗:', error)
      toast.error(error instanceof Error ? error.message : '圖片編輯失敗')
    } finally {
      setIsProcessing(false)
    }
  }

  // 清除所有輸入
  const handleClear = () => {
    setSourceImage(null)
    setMaskImage(null)
    setEditPrompt('')
    setSourcePreview('')
    setMaskPreview('')
    setProcessedImage(null)
    if (sourceInputRef.current) sourceInputRef.current.value = ''
    if (maskInputRef.current) maskInputRef.current.value = ''
  }

  // 渲染圖片上傳區域
  const renderUploadArea = (
    type: 'source' | 'mask',
    preview: string,
    title: string,
    description: string
  ) => (
    <div
      className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors'
      onDrop={e => handleDrop(e, type)}
      onDragOver={handleDragOver}
    >
      {preview ? (
        <div className='relative'>
          <img
            src={preview}
            alt={`${type} preview`}
            className='max-w-full max-h-48 mx-auto rounded-lg'
          />
          <button
            onClick={() => {
              if (type === 'source') {
                setSourceImage(null)
                setSourcePreview('')
                if (sourceInputRef.current) sourceInputRef.current.value = ''
              } else {
                setMaskImage(null)
                setMaskPreview('')
                if (maskInputRef.current) maskInputRef.current.value = ''
              }
            }}
            className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600'
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
      ) : (
        <div className='space-y-2'>
          <svg
            className='w-12 h-12 mx-auto text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          <div>
            <h3 className='text-sm font-medium text-gray-900'>{title}</h3>
            <p className='text-xs text-gray-500 mt-1'>{description}</p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              if (type === 'source') {
                sourceInputRef.current?.click()
              } else {
                maskInputRef.current?.click()
              }
            }}
          >
            選擇圖片
          </Button>
        </div>
      )}

      <input
        ref={type === 'source' ? sourceInputRef : maskInputRef}
        type='file'
        accept='image/*'
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) {
            handleImageSelect(file, type)
          }
        }}
        className='hidden'
      />
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 模式選擇 */}
      <Card className='p-6'>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-semibold text-gray-900'>圖片編輯</h2>
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => setMode('variation')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'variation'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                圖片變體
              </button>
              <button
                onClick={() => setMode('edit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'edit'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                圖片編輯
              </button>
            </div>
          </div>

          {/* 模式說明 */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-start space-x-2'>
              <svg
                className='w-5 h-5 text-blue-500 mt-0.5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              <div className='text-sm text-blue-800'>
                {mode === 'variation' ? (
                  <div>
                    <strong>圖片變體模式：</strong>
                    <p>基於原始圖片生成相似但不同的變體版本。不需要額外的描述或遮罩。</p>
                  </div>
                ) : (
                  <div>
                    <strong>圖片編輯模式：</strong>
                    <p>使用遮罩圖片指定要編輯的區域，並提供描述來指導AI如何修改該區域。</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 圖片上傳區域 */}
      <Card className='p-6'>
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* 原始圖片 */}
            <div>
              <h3 className='text-sm font-medium text-gray-900 mb-3'>原始圖片</h3>
              {renderUploadArea(
                'source',
                sourcePreview,
                '上傳原始圖片',
                '拖放圖片到此處或點擊選擇'
              )}
            </div>

            {/* 遮罩圖片（僅編輯模式） */}
            {mode === 'edit' && (
              <div>
                <h3 className='text-sm font-medium text-gray-900 mb-3'>
                  遮罩圖片
                  <span className='text-xs text-gray-500 ml-2'>（黑色區域將被編輯）</span>
                </h3>
                {renderUploadArea('mask', maskPreview, '上傳遮罩圖片', '黑色區域表示要編輯的部分')}
              </div>
            )}
          </div>

          {/* 編輯描述（僅編輯模式） */}
          {mode === 'edit' && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>編輯描述</label>
              <textarea
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                placeholder='描述您想要在遮罩區域中看到的內容，例如：一隻可愛的小狗...'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
                rows={3}
                maxLength={1000}
              />
              <div className='flex justify-end mt-2 text-sm text-gray-500'>
                <span>{editPrompt.length}/1000</span>
              </div>
            </div>
          )}

          {/* 操作按鈕 */}
          <div className='flex items-center justify-between'>
            <Button variant='outline' onClick={handleClear} disabled={isProcessing}>
              清除全部
            </Button>

            <div className='flex items-center space-x-3'>
              {mode === 'variation' ? (
                <Button
                  onClick={handleCreateVariation}
                  disabled={!sourceImage || isProcessing}
                  className='px-6'
                >
                  {isProcessing ? (
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      <span>生成中...</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                        />
                      </svg>
                      <span>生成變體</span>
                    </div>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleEditImage}
                  disabled={!sourceImage || !maskImage || !editPrompt.trim() || isProcessing}
                  className='px-6'
                >
                  {isProcessing ? (
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                      <span>編輯中...</span>
                    </div>
                  ) : (
                    <div className='flex items-center space-x-2'>
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                        />
                      </svg>
                      <span>編輯圖片</span>
                    </div>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 處理結果 */}
      {processedImage && (
        <div>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>處理結果</h3>
          <ImagePreview
            image={processedImage}
            onDownload={() => {
              ImageService.downloadImage(
                processedImage.imageUrl,
                `${mode}-${processedImage.id}.png`
              )
            }}
            onRegenerate={mode === 'variation' ? handleCreateVariation : handleEditImage}
          />
        </div>
      )}
    </div>
  )
}
