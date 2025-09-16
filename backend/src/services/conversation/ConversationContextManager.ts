import { Message } from '../../types';

export interface ConversationContext {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  tokenCount: number;
  maxTokens: number;
}

export class ConversationContextManager {
  private static readonly DEFAULT_MAX_TOKENS = 4000;
  private static readonly SYSTEM_MESSAGE_TOKENS = 50; // 估算系統訊息的token數

  /**
   * 構建對話上下文
   */
  static buildContext(
    messages: Message[],
    systemPrompt?: string,
    maxTokens: number = this.DEFAULT_MAX_TOKENS
  ): ConversationContext {
    const contextMessages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }> = [];

    let tokenCount = 0;

    // 添加系統提示（如果有）
    if (systemPrompt) {
      contextMessages.push({
        role: 'system',
        content: systemPrompt,
      });
      tokenCount +=
        this.estimateTokens(systemPrompt) + this.SYSTEM_MESSAGE_TOKENS;
    }

    // 從最新的訊息開始，向前添加直到達到token限制
    const reversedMessages = [...messages].reverse();

    for (const message of reversedMessages) {
      const messageTokens = this.estimateTokens(message.content);

      // 檢查是否會超過token限制
      if (tokenCount + messageTokens > maxTokens * 0.8) {
        // 保留20%的空間給回應
        break;
      }

      contextMessages.unshift({
        role: message.role as 'user' | 'assistant',
        content: message.content,
      });

      tokenCount += messageTokens;
    }

    return {
      messages: contextMessages,
      tokenCount,
      maxTokens,
    };
  }

  /**
   * 智能截斷對話上下文
   */
  static truncateContext(
    messages: Message[],
    maxTokens: number,
    preserveSystemMessage: boolean = true
  ): Message[] {
    if (messages.length === 0) {
      return [];
    }

    let totalTokens = 0;
    const truncatedMessages: Message[] = [];

    // 從最新的訊息開始計算
    const reversedMessages = [...messages].reverse();

    for (const message of reversedMessages) {
      const messageTokens = this.estimateTokens(message.content);

      if (totalTokens + messageTokens > maxTokens) {
        break;
      }

      truncatedMessages.unshift(message);
      totalTokens += messageTokens;
    }

    // 確保對話的完整性（用戶訊息後應該有助手回應）
    return this.ensureConversationIntegrity(truncatedMessages);
  }

  /**
   * 確保對話的完整性
   */
  private static ensureConversationIntegrity(messages: Message[]): Message[] {
    if (messages.length === 0) {
      return messages;
    }

    // 如果第一條訊息是助手的回應，移除它以保持對話的邏輯性
    if (messages[0].role === 'assistant') {
      messages = messages.slice(1);
    }

    // 如果最後一條訊息是用戶的，這是正常的（等待助手回應）
    // 如果最後一條訊息是助手的，也是正常的（完整的對話輪次）

    return messages;
  }

  /**
   * 估算文本的token數量
   * 這是一個簡化的估算，實際應該使用具體模型的tokenizer
   */
  private static estimateTokens(text: string): number {
    // 簡化估算：平均每個token約4個字符（英文）或1.5個字符（中文）
    const chineseCharCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherCharCount = text.length - chineseCharCount;

    return Math.ceil(chineseCharCount / 1.5 + otherCharCount / 4);
  }

  /**
   * 獲取對話摘要
   */
  static generateConversationSummary(
    messages: Message[],
    maxLength: number = 100
  ): string {
    if (messages.length === 0) {
      return '空對話';
    }

    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) {
      return '無用戶訊息';
    }

    let summary = firstUserMessage.content;

    // 如果內容太長，截斷並添加省略號
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength - 3) + '...';
    }

    return summary;
  }

  /**
   * 分析對話模式
   */
  static analyzeConversationPattern(messages: Message[]): {
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    averageMessageLength: number;
    conversationTurns: number;
    lastActivity: Date | null;
  } {
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');

    const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);
    const averageMessageLength =
      messages.length > 0 ? Math.round(totalLength / messages.length) : 0;

    // 對話輪次：每個用戶訊息算一輪
    const conversationTurns = userMessages.length;

    const lastActivity =
      messages.length > 0
        ? new Date(
            Math.max(...messages.map(m => new Date(m.timestamp).getTime()))
          )
        : null;

    return {
      totalMessages: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      averageMessageLength,
      conversationTurns,
      lastActivity,
    };
  }

  /**
   * 檢查對話是否需要新的標題
   */
  static shouldUpdateTitle(conversation: {
    title: string;
    messages: Message[];
  }): boolean {
    // 如果標題是預設的或者很短，且有足夠的對話內容，建議更新標題
    const isDefaultTitle =
      conversation.title.includes('新對話') ||
      conversation.title.includes('New Conversation') ||
      conversation.title.length < 10;

    const hasEnoughContent = conversation.messages.length >= 4; // 至少2輪對話

    return isDefaultTitle && hasEnoughContent;
  }

  /**
   * 生成智能標題建議
   */
  static generateTitleSuggestion(messages: Message[]): string {
    if (messages.length === 0) {
      return '新對話';
    }

    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) {
      return '新對話';
    }

    let title = firstUserMessage.content;

    // 移除常見的開場白
    const greetings = ['你好', 'hello', 'hi', '請問', '我想', '能否', '可以'];
    for (const greeting of greetings) {
      if (title.toLowerCase().startsWith(greeting)) {
        title = title.substring(greeting.length).trim();
        break;
      }
    }

    // 提取關鍵詞或主題
    const keywords = this.extractKeywords(title);
    if (keywords.length > 0) {
      title = keywords.slice(0, 3).join(' '); // 取前3個關鍵詞
    }

    // 限制長度
    if (title.length > 30) {
      title = title.substring(0, 27) + '...';
    }

    return title || '新對話';
  }

  /**
   * 簡單的關鍵詞提取
   */
  private static extractKeywords(text: string): string[] {
    // 移除標點符號和停用詞
    const stopWords = [
      '的',
      '了',
      '在',
      '是',
      '我',
      '你',
      '他',
      '她',
      '它',
      '們',
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
    ];

    const words = text
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ') // 保留中文字符和字母數字
      .split(/\s+/)
      .filter(
        word => word.length > 1 && !stopWords.includes(word.toLowerCase())
      );

    // 簡單的詞頻統計
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      wordCount.set(lowerWord, (wordCount.get(lowerWord) || 0) + 1);
    });

    // 按頻率排序並返回
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }
}
