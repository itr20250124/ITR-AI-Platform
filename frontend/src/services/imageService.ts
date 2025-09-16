import { apiClient } from './api';

export interface ImageGenerationParameters {
  model?: string;
  size?: string;
  quality?: string;
  style?: string;
  n?: number;
}

export interface ImageGenerationRequest {
  prompt: string;
  provider: string;
  parameters?: ImageGenerationParameters;
}

export interface ImageEditRequest {
  imageFile: File;
  prompt: string;
  provider: string;
  maskFile?: File;
  parameters?: ImageGenerationParameters;
}

export interface ImageVariationRequest {
  imageFile: File;
  provider: string;
  parameters?: ImageGenerationParameters;
}

export interface ImageResponse {
  id: string;
  imageUrl: string;
  prompt?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ImageHistory {
  images: ImageResponse[];
  total: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  createdAt: string;
}

const normalizeImageResponse = (data: any): ImageResponse => ({
  id: data.id,
  imageUrl: data.imageUrl,
  prompt: data.prompt,
  status: data.status,
  metadata: data.metadata ?? undefined,
  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
});

const appendParametersToFormData = (formData: FormData, parameters?: ImageGenerationParameters) => {
  if (parameters && Object.keys(parameters).length > 0) {
    formData.append('parameters', JSON.stringify(parameters));
  }
};

const createCanvas = (): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D | null } => {
  const CanvasCtor = (globalThis as any).HTMLCanvasElement;
  if (typeof CanvasCtor === 'function') {
    try {
      const fallback = new CanvasCtor() as HTMLCanvasElement;
      const context = typeof fallback.getContext === 'function' ? fallback.getContext('2d') : null;
      return { canvas: fallback, ctx: context as CanvasRenderingContext2D | null };
    } catch {
      // Ignore and fall back to document.createElement for environments where the constructor is not callable
    }
  }

  const element = document.createElement('canvas') as HTMLCanvasElement;
  const context = typeof element.getContext === 'function' ? element.getContext('2d') : null;
  return { canvas: element, ctx: context };
};

export class ImageService {
  static async generateImage(request: ImageGenerationRequest): Promise<ImageResponse> {
    try {
      const response = await apiClient.post('/ai/image/generate', request);
      return normalizeImageResponse(response.data.data);
    } catch (error) {
      console.error('Error generating image:', error);
      throw error instanceof Error ? error : new Error('生成圖片時發生未知錯誤');
    }
  }

  static async editImage(request: ImageEditRequest): Promise<ImageResponse> {
    try {
      const formData = new FormData();
      formData.append('provider', request.provider);
      formData.append('prompt', request.prompt);
      formData.append('image', request.imageFile);
      if (request.maskFile) {
        formData.append('mask', request.maskFile);
      }
      appendParametersToFormData(formData, request.parameters);

      const response = await apiClient.post('/ai/image/edit', formData);
      return normalizeImageResponse(response.data.data);
    } catch (error) {
      console.error('Error editing image:', error);
      throw error instanceof Error ? error : new Error('圖片編輯失敗');
    }
  }

  static async createImageVariation(request: ImageVariationRequest): Promise<ImageResponse> {
    try {
      const formData = new FormData();
      formData.append('image', request.imageFile);
      formData.append('provider', request.provider);
      appendParametersToFormData(formData, request.parameters);

      const response = await apiClient.post('/ai/image/variation', formData);
      return normalizeImageResponse(response.data.data);
    } catch (error) {
      console.error('Error creating image variation:', error);
      throw error instanceof Error ? error : new Error('圖片變化產生失敗');
    }
  }

  static async getImageHistory(options?: { limit?: number; offset?: number; type?: string }): Promise<ImageHistory> {
    try {
      const params = new URLSearchParams();
      if (typeof options?.limit === 'number') {
        params.append('limit', options.limit.toString());
      }
      if (typeof options?.offset === 'number') {
        params.append('offset', options.offset.toString());
      }
      if (options?.type) {
        params.append('type', options.type);
      }

      const query = params.toString();
      const url = query ? `/ai/image/history?${query}` : '/ai/image/history';
      const response = await apiClient.get(url);
      const payload = response.data.data ?? response.data;
      return {
        images: (payload.images ?? []).map(normalizeImageResponse),
        total: payload.total ?? 0,
      };
    } catch (error) {
      console.error('Error fetching image history:', error);
      throw error instanceof Error ? error : new Error('取得圖片歷史失敗');
    }
  }

  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 4 * 1024 * 1024; // 4MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: '不支援的圖片格式，請使用 JPEG、PNG 或 WebP 格式' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: '圖片文件過大，請選擇小於 4MB 的圖片' };
    }

    return { valid: true };
  }

  static async compressImage(
    file: File,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
    quality: number = 0.8,
  ): Promise<File> {
    return new Promise((resolve) => {
      const { canvas, ctx } = createCanvas();
      if (!ctx || typeof ctx.drawImage !== 'function') {
        resolve(file);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const width = img.width || (img as any).naturalWidth || 0;
        const height = img.height || (img as any).naturalHeight || 0;
        const ratio = Math.min(maxWidth / (width || 1), maxHeight / (height || 1), 1);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(new File([blob], file.name, { type: file.type }));
              } else {
                resolve(file);
              }
            },
            file.type,
            quality,
          );
        } else {
          resolve(file);
        }
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  static async getImageAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('讀取圖片失敗'));
      reader.readAsDataURL(file);
    });
  }

  static async downloadImage(imageUrl: string, filename: string): Promise<void> {
    try {
      const response: any = await fetch(imageUrl);
      if ('ok' in response && !response.ok) {
        throw new Error('下載圖片失敗');
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error downloading image:', error);
      throw new Error('下載圖片失敗');
    }
  }

  static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width || (img as any).naturalWidth || 0,
          height: img.height || (img as any).naturalHeight || 0,
        });
      };
      img.onerror = () => {
        reject(new Error('無法讀取圖片尺寸'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  static async createThumbnail(file: File, maxSize: number = 200): Promise<string> {
    return new Promise((resolve) => {
      const { canvas, ctx } = createCanvas();
      const img = new Image();

      img.onload = () => {
        const width = img.width || (img as any).naturalWidth || 0;
        const height = img.height || (img as any).naturalHeight || 0;
        const ratio = Math.min(maxSize / (width || 1), maxSize / (height || 1), 1);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);

        if (ctx && typeof ctx.drawImage === 'function') {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        if (typeof canvas.toDataURL === 'function') {
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          resolve('');
        }
      };

      img.onerror = () => resolve('');
      img.src = URL.createObjectURL(file);
    });
  }

  async generateImage(prompt: string, options?: { provider?: string; parameters?: ImageGenerationParameters }): Promise<string> {
    const response = await ImageService.generateImage({
      prompt,
      provider: options?.provider ?? 'openai',
      parameters: options?.parameters,
    });

    return response.imageUrl;
  }

  async editImage(request: ImageEditRequest): Promise<ImageResponse> {
    return ImageService.editImage(request);
  }

  async createImageVariation(request: ImageVariationRequest): Promise<ImageResponse> {
    return ImageService.createImageVariation(request);
  }

  async getImageHistory(options?: { limit?: number; offset?: number; type?: string }): Promise<ImageHistory> {
    return ImageService.getImageHistory(options);
  }

  async deleteImage(imageId: string): Promise<void> {
    try {
      await apiClient.delete(`/ai/image/${imageId}`);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error instanceof Error ? error : new Error('刪除圖片失敗');
    }
  }
}

export const imageService = new ImageService();
