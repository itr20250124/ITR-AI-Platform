import { Message, Conversation } from '../../types';

// ChatInterface 組件類型
export interface ChatInterfaceProps {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onUpdateConversation: (updates: Partial<Conversation>) => void;
  onDeleteConversation: () => void;
  onNewConversation: () => void;
  className?: string;
}

// ChatMessage 組件類型
export interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onStop?: () => void;
  className?: string;
}

// ChatInput 組件類型
export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

// ChatHeader 組件類型
export interface ChatHeaderProps {
  conversation: Conversation;
  onUpdateConversation: (updates: Partial<Conversation>) => void;
  onDeleteConversation: () => void;
  onNewConversation: () => void;
  className?: string;
}

// AIModelSelector 組件類型
export interface AIModelSelectorProps {
  currentProvider: string;
  currentParameters: Record<string, any>;
  onModelChange: (provider: string, parameters?: Record<string, any>) => void;
  className?: string;
}

// LoadingIndicator 組件類型
export interface LoadingIndicatorProps {
  message?: string;
  className?: string;
}

// AI模型定義
export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  parameters: Array<{
    key: string;
    type: 'number' | 'string' | 'boolean' | 'select';
    defaultValue: any;
    min?: number;
    max?: number;
    options?: string[];
    description: string;
  }>;
}

// 聊天狀態
export interface ChatState {
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  error: string | null;
}

// 聊天操作
export interface ChatActions {
  sendMessage: (content: string) => Promise<void>;
  createConversation: (title: string, aiProvider: string) => Promise<void>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  clearError: () => void;
}

// 串流回應事件
export interface StreamingEvent {
  type: 'start' | 'chunk' | 'end' | 'error';
  data?: string;
  error?: string;
}

// 聊天設定
export interface ChatSettings {
  autoScroll: boolean;
  showTimestamps: boolean;
  enableMarkdown: boolean;
  maxMessageLength: number;
  retryAttempts: number;
}