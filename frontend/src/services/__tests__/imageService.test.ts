import {
  ImageService,
  ImageGenerationRequest,
  ImageVariationRequest,
  ImageEditRequest,
} from '../imageService'
import { apiClient } from '../api'

// Mock apiClient
jest.mock('../api')
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>

// Mock DOM APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn(),
  },
})

Object.defineProperty(global, 'FileReader', {
  value: class MockFileReader {
    onload: ((event: any) => void) | null = null
    onerror: ((event: any) => void) | null = null
    result: string | null = null

    readAsDataURL(file: File) {
      setTimeout(() => {
        this.result = `data:${file.type};base64,mock-base64-data`
        if (this.onload) {
          this.onload({ target: { result: this.result } } as any)
        }
      }, 0)
    }
  },
})

Object.defineProperty(global, 'Image', {
  value: class MockImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    naturalWidth = 1024
    naturalHeight = 1024
    src = ''

    constructor() {
      setTimeout(() => {
        if (this.onload) {
          this.onload()
        }
      }, 0)
    }
  },
})

// Mock canvas
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: class MockCanvas {
    width = 0
    height = 0

    getContext() {
      return {
        drawImage: jest.fn(),
      }
    }

    toBlob(callback: (blob: Blob | null) => void) {
      const mockBlob = new Blob(['mock canvas data'], { type: 'image/jpeg' })
      setTimeout(() => callback(mockBlob), 0)
    }

    toDataURL() {
      return 'data:image/jpeg;base64,mock-canvas-data'
    }
  },
})

describe('ImageService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('generateImage', () => {
    it('should generate image successfully', async () => {
      // Arrange
      const request: ImageGenerationRequest = {
        prompt: 'A beautiful sunset',
        provider: 'openai',
        parameters: {
          model: 'dall-e-3',
          size: '1024x1024',
        },
      }

      const mockResponse = {
        data: {
          data: {
            id: 'img-123',
            imageUrl: 'https://example.com/image.png',
            prompt: 'A beautiful sunset',
            status: 'completed',
            createdAt: '2024-01-01T00:00:00Z',
            metadata: {
              model: 'dall-e-3',
              size: '1024x1024',
            },
          },
        },
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      // Act
      const result = await ImageService.generateImage(request)

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/ai/image/generate', request)
      expect(result).toEqual({
        id: 'img-123',
        imageUrl: 'https://example.com/image.png',
        prompt: 'A beautiful sunset',
        status: 'completed',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        metadata: {
          model: 'dall-e-3',
          size: '1024x1024',
        },
      })
    })

    it('should handle API errors', async () => {
      // Arrange
      const request: ImageGenerationRequest = {
        prompt: 'Test prompt',
        provider: 'openai',
      }

      mockApiClient.post.mockRejectedValue(new Error('API Error'))

      // Act & Assert
      await expect(ImageService.generateImage(request)).rejects.toThrow('API Error')
    })
  })

  describe('createImageVariation', () => {
    it('should create image variation successfully', async () => {
      // Arrange
      const mockFile = new File(['fake image data'], 'test.png', { type: 'image/png' })
      const request: ImageVariationRequest = {
        imageFile: mockFile,
        provider: 'openai',
        parameters: { size: '1024x1024' },
      }

      const mockResponse = {
        data: {
          data: {
            id: 'var-123',
            imageUrl: 'https://example.com/variation.png',
            prompt: 'Image variation',
            status: 'completed',
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      // Act
      const result = await ImageService.createImageVariation(request)

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/ai/image/variation', expect.any(FormData))
      expect(result.id).toBe('var-123')
    })
  })

  describe('editImage', () => {
    it('should edit image successfully', async () => {
      // Arrange
      const mockImageFile = new File(['fake image data'], 'image.png', { type: 'image/png' })
      const mockMaskFile = new File(['fake mask data'], 'mask.png', { type: 'image/png' })
      const request: ImageEditRequest = {
        imageFile: mockImageFile,
        maskFile: mockMaskFile,
        prompt: 'Add a rainbow',
        provider: 'openai',
      }

      const mockResponse = {
        data: {
          data: {
            id: 'edit-123',
            imageUrl: 'https://example.com/edited.png',
            prompt: 'Add a rainbow',
            status: 'completed',
            createdAt: '2024-01-01T00:00:00Z',
          },
        },
      }

      mockApiClient.post.mockResolvedValue(mockResponse)

      // Act
      const result = await ImageService.editImage(request)

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith('/ai/image/edit', expect.any(FormData))
      expect(result.id).toBe('edit-123')
    })
  })

  describe('getImageHistory', () => {
    it('should get image history successfully', async () => {
      // Arrange
      const mockResponse = {
        data: {
          data: {
            images: [
              {
                id: 'img-1',
                imageUrl: 'https://example.com/image1.png',
                prompt: 'First image',
                status: 'completed',
                createdAt: '2024-01-01T00:00:00Z',
              },
            ],
            total: 1,
          },
        },
      }

      mockApiClient.get.mockResolvedValue(mockResponse)

      // Act
      const result = await ImageService.getImageHistory({ limit: 10 })

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/ai/image/history?limit=10')
      expect(result.images).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.images[0].createdAt).toBeInstanceOf(Date)
    })
  })

  describe('downloadImage', () => {
    it('should download image successfully', async () => {
      // Arrange
      const imageUrl = 'https://example.com/image.png'
      const filename = 'test-image.png'

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['fake image data'])),
      })

      // Mock DOM manipulation
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      }
      const originalCreateElement = document.createElement.bind(document)
      const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation(((
        tagName: string,
        ...args: any[]
      ) => {
        if (tagName.toLowerCase() === 'a') {
          return mockLink as any
        }
        return originalCreateElement(tagName, ...args)
      }) as any)
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation()
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation()

      // Act
      await ImageService.downloadImage(imageUrl, filename)

      // Assert
      expect(fetch).toHaveBeenCalledWith(imageUrl)
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(mockLink.download).toBe(filename)
      expect(mockLink.click).toHaveBeenCalled()
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink)
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink)
    })

    it('should handle download errors', async () => {
      // Arrange
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      // Act & Assert
      await expect(ImageService.downloadImage('invalid-url', 'test.png')).rejects.toThrow(
        '下載圖片失敗'
      )
    })
  })

  describe('getImageAsBase64', () => {
    it('should convert image to base64 successfully', async () => {
      // Arrange
      const mockFile = new File(['fake image data'], 'test.png', { type: 'image/png' })

      // Act
      const result = await ImageService.getImageAsBase64(mockFile)

      // Assert
      expect(result).toBe('data:image/png;base64,mock-base64-data')
    })

    it('should handle file reading errors', async () => {
      // Arrange
      const mockFile = new File(['fake image data'], 'test.png', { type: 'image/png' })

      // Mock FileReader error
      Object.defineProperty(global, 'FileReader', {
        value: class MockFileReader {
          onload: ((event: any) => void) | null = null
          onerror: ((event: any) => void) | null = null

          readAsDataURL() {
            setTimeout(() => {
              if (this.onerror) {
                this.onerror({} as any)
              }
            }, 0)
          }
        },
      })

      // Act & Assert
      await expect(ImageService.getImageAsBase64(mockFile)).rejects.toThrow('讀取圖片失敗')
    })
  })

  describe('validateImageFile', () => {
    it('should validate valid image file', () => {
      // Arrange
      const validFile = new File(['fake data'], 'test.png', { type: 'image/png' })
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }) // 1MB

      // Act
      const result = ImageService.validateImageFile(validFile)

      // Assert
      expect(result.valid).toBe(true)
    })

    it('should reject invalid file type', () => {
      // Arrange
      const invalidFile = new File(['fake data'], 'test.txt', { type: 'text/plain' })

      // Act
      const result = ImageService.validateImageFile(invalidFile)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('不支援的圖片格式，請使用 JPEG、PNG 或 WebP 格式')
    })

    it('should reject oversized file', () => {
      // Arrange
      const oversizedFile = new File(['fake data'], 'test.png', { type: 'image/png' })
      Object.defineProperty(oversizedFile, 'size', { value: 5 * 1024 * 1024 }) // 5MB

      // Act
      const result = ImageService.validateImageFile(oversizedFile)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('圖片文件過大，請選擇小於 4MB 的圖片')
    })
  })

  describe('compressImage', () => {
    it('should compress image successfully', async () => {
      // Arrange
      const mockFile = new File(['fake image data'], 'test.png', { type: 'image/png' })

      // Act
      const result = await ImageService.compressImage(mockFile, 512, 512, 0.8)

      // Assert
      expect(result).toBeInstanceOf(File)
      expect(result.name).toBe('test.png')
      expect(result.type).toBe('image/png')
    })
  })

  describe('getImageDimensions', () => {
    it('should get image dimensions successfully', async () => {
      // Act
      const mockFile = new File(['fake image data'], 'test.png', { type: 'image/png' })
      const result = await ImageService.getImageDimensions(mockFile)

      // Assert
      expect(result).toEqual({
        width: 1024,
        height: 1024,
      })
    })
  })

  describe('createThumbnail', () => {
    it('should create thumbnail successfully', async () => {
      // Arrange
      const mockFile = new File(['fake image data'], 'test.png', { type: 'image/png' })

      // Act
      const result = await ImageService.createThumbnail(mockFile, 200)

      // Assert
      expect(result).toBe('data:image/jpeg;base64,mock-canvas-data')
    })
  })
})
