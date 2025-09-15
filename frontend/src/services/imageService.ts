import { apiClient } from './api';

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  size?: string;
  quality?: string;
  style?: string;
}

export interface ImageEditRequest {
  imageUrl: string;
  prompt: string;
  mask?: string;
}

export interface ImageVariationRequest {
  imageFile: File;
  provider: string;
  parameters: {
    n: number;
    size: string;
  };
}

export interface ImageResponse {
  id: string;
  imageUrl: string;
  prompt?: string;
  metadata?: {
    type: 'generation' | 'variation' | 'edit';
    model?: string;
    size?: string;
  };
  createdAt: string;
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

export class ImageService {
  async generateImage(prompt: string, options?: Partial<ImageGenerationRequest>): Promise<string> {
    try {
      const response = await apiClient.post('/ai/image/generate', {
        prompt,
        model: options?.model || 'dall-e-3',
        size: options?.size || '1024x1024',
        quality: options?.quality || 'standard',
        style: options?.style || 'vivid',
      });

      return response.data.imageUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image');
    }
  }

  async editImage(request: ImageEditRequest): Promise<string> {
    try {
      const response = await apiClient.post('/ai/image/edit', request);
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error editing image:', error);
      throw new Error('Failed to edit image');
    }
  }

  async createImageVariation(request: ImageVariationRequest): Promise<ImageResponse> {
    try {
      const formData = new FormData();
      formData.append('image', request.imageFile);
      formData.append('provider', request.provider);
      formData.append('parameters', JSON.stringify(request.parameters));

      const response = await apiClient.post('/ai/image/variation', formData);
      return response.data;
    } catch (error) {
      console.error('Error creating image variation:', error);
      throw new Error('Failed to create image variation');
    }
  }

  async getImageHistory(options?: { limit?: number; offset?: number; type?: string }): Promise<ImageHistory> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.type) params.append('type', options.type);

      const response = await apiClient.get(`/ai/image/history?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching image history:', error);
      throw new Error('Failed to fetch image history');
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    try {
      await apiClient.delete(`/ai/image/${imageId}`);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('Failed to delete image');
    }
  }

  // Utility methods
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 4 * 1024 * 1024; // 4MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Only JPEG, PNG, and WebP images are supported' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'Image size must be less than 4MB' };
    }

    return { valid: true };
  }

  static async compressImage(file: File, maxWidth: number = 1024): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          } else {
            resolve(file);
          }
        }, file.type, 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  static async getImageAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  static downloadImage(imageUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Export both the class and a default instance
export const imageService = new ImageService();