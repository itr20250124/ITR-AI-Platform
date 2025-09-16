import Joi from 'joi';

/**
 * 聊天訊息驗證架構
 */
export const chatMessageSchema = Joi.object({
  message: Joi.string().required().min(1).max(10000),
  provider: Joi.string().valid('openai', 'gemini').default('openai'),
  parameters: Joi.object({
    // OpenAI parameters
    model: Joi.string(),
    temperature: Joi.number().min(0).max(2),
    maxTokens: Joi.number().min(1).max(4000),
    topP: Joi.number().min(0).max(1),
    frequencyPenalty: Joi.number().min(-2).max(2),
    presencePenalty: Joi.number().min(-2).max(2),
    // Gemini parameters
    maxOutputTokens: Joi.number().min(1).max(8192),
    topK: Joi.number().min(1).max(40),
  }).default({}),
});

/**
 * 聊天上下文訊息驗證架構
 */
export const chatContextSchema = Joi.object({
  messages: Joi.array()
    .items(
      Joi.object({
        role: Joi.string().valid('user', 'assistant', 'system').required(),
        content: Joi.string().required().min(1).max(10000),
      })
    )
    .required()
    .min(1)
    .max(50),
  provider: Joi.string().valid('openai', 'gemini').default('openai'),
  parameters: Joi.object({
    // OpenAI parameters
    model: Joi.string(),
    temperature: Joi.number().min(0).max(2),
    maxTokens: Joi.number().min(1).max(4000),
    topP: Joi.number().min(0).max(1),
    frequencyPenalty: Joi.number().min(-2).max(2),
    presencePenalty: Joi.number().min(-2).max(2),
    // Gemini parameters
    maxOutputTokens: Joi.number().min(1).max(8192),
    topK: Joi.number().min(1).max(40),
  }).default({}),
});

/**
 * 圖片生成驗證架構
 */
export const imageGenerationSchema = Joi.object({
  prompt: Joi.string().required().min(1).max(1000),
  provider: Joi.string().valid('openai', 'dall-e').default('openai'),
  parameters: Joi.object({
    model: Joi.string().valid('dall-e-2', 'dall-e-3'),
    size: Joi.string().valid('256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'),
    quality: Joi.string().valid('standard', 'hd'),
    style: Joi.string().valid('vivid', 'natural'),
    n: Joi.number().min(1).max(4),
  }).default({}),
});

/**
 * 圖片變體驗證架構
 */
export const imageVariationSchema = Joi.object({
  provider: Joi.string().valid('openai', 'dall-e').default('openai'),
  parameters: Joi.object({
    n: Joi.number().min(1).max(4),
    size: Joi.string().valid('256x256', '512x512', '1024x1024'),
  }).default({}),
});

/**
 * 圖片編輯驗證架構
 */
export const imageEditSchema = Joi.object({
  prompt: Joi.string().required().min(1).max(1000),
  provider: Joi.string().valid('openai', 'dall-e').default('openai'),
  parameters: Joi.object({
    n: Joi.number().min(1).max(4),
    size: Joi.string().valid('256x256', '512x512', '1024x1024'),
  }).default({}),
});
