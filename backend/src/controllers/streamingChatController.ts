import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { AIServiceFactory } from '../services/ai/AIServiceFactory';

/**
 * 串流聊天端點
 */
export const streamChat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { messages, provider = 'openai', parameters = {} } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '用戶未認證',
        },
      });
      return;
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_MESSAGES',
          message: '缺少訊息內容',
        },
      });
      return;
    }

    // 設置SSE響應頭
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    try {
      const chatService = AIServiceFactory.createChatService(provider);

      // 檢查服務是否支持串流
      if (typeof chatService.sendMessageStream === 'function') {
        // 使用串流方法
        const lastMessage = messages[messages.length - 1];
        const streamGenerator = chatService.sendMessageStream(lastMessage.content, parameters);

        // 發送開始事件
        res.write('data: {"type": "start"}\n\n');

        // 處理串流數據
        for await (const chunk of streamGenerator) {
          if (chunk.content) {
            const data = JSON.stringify({
              type: 'chunk',
              content: chunk.content,
              metadata: chunk.metadata,
            });
            res.write(`data: ${data}\n\n`);
          }
        }

        // 發送結束事件
        res.write('data: {"type": "end"}\n\n');
        res.write('data: [DONE]\n\n');
      } else {
        // 如果不支持串流，使用普通方法並模擬串流
        const response = await chatService.sendMessageWithContext(messages, parameters);

        // 模擬串流效果，將回應分塊發送
        const content = response.content;
        const chunkSize = 10; // 每次發送10個字符

        res.write('data: {"type": "start"}\n\n');

        for (let i = 0; i < content.length; i += chunkSize) {
          const chunk = content.slice(i, i + chunkSize);
          const data = JSON.stringify({
            type: 'chunk',
            content: chunk,
          });
          res.write(`data: ${data}\n\n`);

          // 添加小延遲以模擬串流效果
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        res.write('data: {"type": "end"}\n\n');
        res.write('data: [DONE]\n\n');
      }
    } catch (error) {
      console.error('Streaming chat error:', error);

      const errorData = JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      res.write(`data: ${errorData}\n\n`);
    }

    res.end();
  } catch (error) {
    console.error('Stream setup error:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '串流聊天失敗',
        },
      });
    }
  }
};
