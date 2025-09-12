// 前端特定類型定義
export * from '../../../shared/types';

// 主題相關類型
export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// UI組件Props類型
export interface AIServiceSelectorProps {
  selectedService: string;
  availableServices: AIService[];
  onServiceChange: (service: string) => void;
}

export interface ParameterControlProps {
  parameters: Record<string, any>;
  onParameterChange: (key: string, value: any) => void;
  serviceType: string;
  parameterDefinitions: ParameterDefinition[];
}

export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
}

export interface ImageGeneratorProps {
  onGenerate: (prompt: string, parameters: ImageParameters) => void;
  isGenerating: boolean;
  generatedImages: GeneratedImage[];
}

export interface VideoGeneratorProps {
  onGenerate: (prompt: string, parameters: VideoParameters) => void;
  isGenerating: boolean;
  generatedVideos: GeneratedVideo[];
}

// AI服務類型
export interface AIService {
  id: string;
  name: string;
  type: 'chat' | 'image' | 'video';
  available: boolean;
  config: AIProviderConfig;
}

// 狀態管理類型
export interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  selectedAIProvider: string;
  conversations: Conversation[];
  currentConversation: Conversation | null;
  generatedImages: GeneratedImage[];
  generatedVideos: GeneratedVideo[];
  isLoading: boolean;
  error: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// API客戶端類型
export interface APIClient {
  get<T>(url: string): Promise<APIResponse<T>>;
  post<T>(url: string, data?: any): Promise<APIResponse<T>>;
  put<T>(url: string, data?: any): Promise<APIResponse<T>>;
  delete<T>(url: string): Promise<APIResponse<T>>;
}

// 路由類型
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  protected?: boolean;
  title?: string;
}

import { ParameterDefinition, Message, ImageParameters, VideoParameters, GeneratedImage, GeneratedVideo, User, Conversation, AIProviderConfig, APIResponse } from '../../../shared/types';