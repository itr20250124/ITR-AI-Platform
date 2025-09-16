import OpenAI from 'openai';
import { BaseAIService } from '../BaseAIService';
import { 
  ChatServiceInterface, 
  ChatParameters, 
  ChatResponse 
} from '../interfaces/AIServiceInterface';
import { ParameterDefinition } from '../../../types';
import { createRetryHandler } from '../utils/RetryHandler';

/**
 * OpenAI聊天服務
 */
export class OpenAIChatService extends BaseAIService implements ChatServiceInterface {
  public provider = 'openai';
  public supportedParameters: ParameterDefinition[] = [
    {
      key: 'model',
      type: 'select',
      defaultValue: 'gpt-3.5-turbo',
      options: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o'],
      description: '選擇GPT模型',
    },
    {
      key: 'temperature',
      type: 'number',
      defaultValue: 0.7,
      min: 0,
      max: 2,
      description: '控制回應的隨機性和創造性',
    },
    {
      key: 'maxTokens',
      type: 'number',
      defaultValue: 1000,
      min: 1,
      max: 4000,
      description: '最大回應長度（token數）',
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
      key: 'frequencyPenalty',
      type: 'number',
      defaultValue: 0,
      min: -2,
      max: 2,
      description: '頻率懲罰，減少重複內容',
    },
    {
      key: 'presencePenalty',
      type: 'number',
      defaultValue: 0,
      min: -2,
      max: 2,
      description: '存在懲罰，鼓勵談論新話題',
    },
  ];

  private openai: OpenAI;
  private retryHandler = createRetryHandler({
    maxRetries: 3,
    baseDelay: 1000,
  });

  constructor() {
    super();
    this.validateApiKey();
    this.openai = new OpenAI({
      apiKey: this.apiKey,
    });
    this.initializeService();
  }

  protected getApiKey(): string {
    return process.env.OPENAI_API_KEY || '';
  }

  protected getBaseURL(): string {
    return process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
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

      const response = await this.retryHandler.execute(async () => {
        return await this.openai.chat.completions.create({
          model: mergedParams.model,
          messages: [
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: mergedParams.temperature,
          max_tokens: mergedParams.maxTokens,
          top_p: mergedParams.topP,
          frequency_penalty: mergedParams.frequencyPenalty,
          presence_penalty: mergedParams.presencePenalty,
        });
      }, 'OpenAI Chat');

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI');
      }

      return {
        id: this.generateId(),
        content: choice.message.content || '',
        role: 'assistant',
        timestamp: new Date(),
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
        metadata: {
          model: mergedParams.model,
          finishReason: choice.finish_reason,
          conversationId,
        },
      };
    } catch (error) {
      this.handleApiError(error);
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

      const response = await this.retryHandler.execute(async () => {
        return await this.openai.chat.completions.create({
          model: mergedParams.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          temperature: mergedParams.temperature,
          max_tokens: mergedParams.maxTokens,
          top_p: mergedParams.topP,
          frequency_penalty: mergedParams.frequencyPenalty,
          presence_penalty: mergedParams.presencePenalty,
        });
      }, 'OpenAI Chat with Context');

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI');
      }

      return {
        id: this.generateId(),
        content: choice.message.content || '',
        role: 'assistant',
        timestamp: new Date(),
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
        metadata: {
          model: mergedParams.model,
          finishReason: choice.finish_reason,
        },
      };
    } catch (error) {
      this.handleApiError(error);
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

      const stream = await this.openai.chat.completions.create({
        model: mergedParams.model,
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: mergedParams.temperature,
        max_tokens: mergedParams.maxTokens,
        top_p: mergedParams.topP,
        frequency_penalty: mergedParams.frequencyPenalty,
        presence_penalty: mergedParams.presencePenalty,
        stream: true,
      });

      let fullContent = '';
      const responseId = this.generateId();

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          yield {
            id: responseId,
            content: delta.content,
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
      this.handleApiError(error);
    }
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

    throw new Error('Invalid input format for OpenAI chat service');
  }
}