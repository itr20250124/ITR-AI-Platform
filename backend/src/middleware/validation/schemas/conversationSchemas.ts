import Joi from 'joi';

/**
 * 創建對話驗證架構
 */
export const createConversationSchema = Joi.object({
  title: Joi.string().required().min(1).max(200).trim(),
  aiProvider: Joi.string().required().valid('openai', 'gemini'),
  parameters: Joi.object().default({}),
});

/**
 * 更新對話驗證架構
 */
export const updateConversationSchema = Joi.object({
  title: Joi.string().min(1).max(200).trim(),
  aiProvider: Joi.string().valid('openai', 'gemini'),
  parameters: Joi.object(),
}).min(1); // 至少需要一個欄位

/**
 * 添加訊息驗證架構
 */
export const addMessageSchema = Joi.object({
  role: Joi.string().required().valid('user', 'assistant'),
  content: Joi.string().required().min(1).max(50000),
  metadata: Joi.object().default({}),
});
