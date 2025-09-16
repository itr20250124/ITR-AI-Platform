import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { BaseAIService } from '../BaseAIService';
import {
  ChatServiceInterface,
  ChatParameters,
  ChatResponse,
} from '../interfaces/AIServiceInterface';
import { ParameterDefinition, AIServiceError } from '../../../types';
import { createRetryHandler } from '../utils/RetryHandler';

/**
 * Google Gemini聊天服務
 */
export class GeminiChatService extends BaseAIService implements ChatServiceInterface {
  public provider = 'gemini';
  public supportedParameters: ParameterDefinition[] = [
    {
      key: 'model',
      type: 'select',
      defaultValue: 'gemini-pro',
      options: ['gemini-pro', 'gemini-pro-vision'],
      description: '選擇Gemini模型',
    },
    {
      key: 'temperature',
      type: 'number',
      defaultValue: 0.9,
      min: 0,
      max: 1,
      description: '控制回應的創造性',
    },
    {
      key: 'maxOutputTokens',
      type: 'number',
      defaultValue: 2048,
      min: 1,
      max: 8192,
      description: '最大輸出token數',
    },
    {
      key: 'topP',
      type: 'number',
      defaultValue: 1,
      min: 0,
      max: 1,
      description: '核心採樣參數',
    },
    {
      key: 'topK',
      type: 'number',
      defaultValue: 1,
      min: 1,
      max: 40,
      description: 'Top-K採樣參數',
    },
  ];

  private genAI: GoogleGenerativeAI;
  private retryHandler = createRetryHandler({
    maxRetries: 3,
    baseDelay: 1000,
  });

  constructor() {
    super();
    this.validateApiKey();
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.initializeService();
  }

  protected getApiKey(): string {
    return process.env.GEMINI_API_KEY || '';
  }

  protected getBaseURL(): string {
    return process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
  }

  /**
   * 獲取模型實例
   */
  private getModel(modelName: string, parameters: Record<string, any>): GenerativeModel {
    return this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: parameters.temperature,
        maxOutputTokens: parameters.maxOutputTokens,
        topP: parameters.topP,
        topK: parameters.topK,
      },
    });
  }

  /**
   * 發送聊天訊息
   */
  async sendMessage(
    message: string,
    parameters: ChatParameters = {},
    conversationId?: string
  ): Promise<ChatResponse> {
    try {
      this.validateParameters(parameters);
      const mergedParams = this.mergeParameters(parameters);

      const model = this.getModel(mergedParams.model, mergedParams);

      const response = await this.retryHandler.execute(async () => {
        const result = await model.generateContent(message);
        return result.response;
      }, 'Gemini Chat');

      const text = response.text();
      if (!text) {
        throw new Error('No response from Gemini');
      }

      return {
        id: this.generateId(),
        content: text,
        role: 'assistant',
        timestamp: new Date(),
        usage: this.extractUsageInfo(response),
        metadata: {
          model: mergedParams.model,
          conversationId,
          candidates: response.candidates?.length || 1,
        },
      };
    } catch (error) {
      this.handleGeminiError(error);
    }
  }

  /**
   * 發送帶上下文的聊天訊息
   */
  async sendMessageWithContext(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    parameters: ChatParameters = {}
  ): Promise<ChatResponse> {
    try {
      this.validateParameters(parameters);
      const mergedParams = this.mergeParameters(parameters);

      const model = this.getModel(mergedParams.model, mergedParams);

      // 轉換訊息格式為Gemini格式
      const history = this.convertMessagesToGeminiFormat(messages.slice(0, -1));
      const lastMessage = messages[messages.length - 1];

      const chat = model.startChat({
        history: history,
      });

      const response = await this.retryHandler.execute(async () => {
        const result = await chat.sendMessage(lastMessage.content);
        return result.response;
      }, 'Gemini Chat with Context');

      const text = response.text();
      if (!text) {
        throw new Error('No response from Gemini');
      }

      return {
        id: this.generateId(),
        content: text,
        role: 'assistant',
        timestamp: new Date(),
        usage: this.extractUsageInfo(response),
        metadata: {
          model: mergedParams.model,
          candidates: response.candidates?.length || 1,
        },
      };
    } catch (error) {
      this.handleGeminiError(error);
    }
  }

  /**
   * 流式聊天回應
   */
  async *sendMessageStream(
    message: string,
    parameters: ChatParameters = {}
  ): AsyncGenerator<Partial<ChatResponse>, void, unknown> {
    try {
      this.validateParameters(parameters);
      const mergedParams = this.mergeParameters(parameters);

      const model = this.getModel(mergedParams.model, mergedParams);

      const result = await model.generateContentStream(message);

      let fullContent = '';
      const responseId = this.generateId();

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          fullContent += chunkText;
          yield {
            id: responseId,
            content: chunkText,
            role: 'assistant',
            timestamp: new Date(),
            metadata: {
              isStream: true,
              fullContent,
            },
          };
        }
      }
    } catch (error) {
      this.handleGeminiError(error);
    }
  }

  /**
   * 轉換訊息格式為Gemini格式
   */
  private convertMessagesToGeminiFormat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  ) {
    return messages
      .filter(msg => msg.role !== 'system') // Gemini不支持system角色
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
  }

  /**
   * 提取使用信息
   */
  private extractUsageInfo(
    response: any
  ): { promptTokens: number; completionTokens: number; totalTokens: number } | undefined {
    // Gemini API目前不提供詳細的token使用信息
    // 這裡可以根據實際API回應結構進行調整
    const usageMetadata = response.usageMetadata;
    if (usageMetadata) {
      return {
        promptTokens: usageMetadata.promptTokenCount || 0,
        completionTokens: usageMetadata.candidatesTokenCount || 0,
        totalTokens: usageMetadata.totalTokenCount || 0,
      };
    }
    return undefined;
  }

  /**
   * 處理Gemini特定錯誤
   */
  private handleGeminiError(error: any): never {
    console.error('Gemini API Error:', error);

    // 檢查是否是Gemini特定錯誤
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new AIServiceError(this.provider, 'UNAUTHORIZED', 'Invalid Gemini API key');
    }

    if (error.message?.includes('QUOTA_EXCEEDED')) {
      throw new AIServiceError(this.provider, 'RATE_LIMIT_EXCEEDED', 'Gemini API quota exceeded');
    }

    if (error.message?.includes('SAFETY')) {
      throw new AIServiceError(
        this.provider,
        'CONTENT_BLOCKED',
        'Content blocked by Gemini safety filters'
      );
    }

    if (error.message?.includes('MODEL_NOT_FOUND')) {
      throw new AIServiceError(this.provider, 'BAD_REQUEST', 'Requested Gemini model not found');
    }

    // 使用基礎錯誤處理
    this.handleApiError(error);
  }

  /**
   * 通用請求方法
   */
  async makeRequest(input: any, parameters: any): Promise<any> {
    if (typeof input === 'string') {
      return this.sendMessage(input, parameters);
    }

    if (Array.isArray(input)) {
      return this.sendMessageWithContext(input, parameters);
    }

    throw new Error('Invalid input format for Gemini chat service');
  }
}
