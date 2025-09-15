import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('開始種子數據...');

  // 創建AI提供商配置
  const openaiConfig = await prisma.aIProviderConfig.upsert({
    where: { name: 'openai' },
    update: {},
    create: {
      name: 'openai',
      type: 'chat',
      apiEndpoint: 'https://api.openai.com/v1',
      apiKeyRequired: true,
      supportedParameters: [
        {
          key: 'temperature',
          type: 'number',
          defaultValue: 0.7,
          min: 0,
          max: 2,
          description: '控制回應的隨機性'
        },
        {
          key: 'maxTokens',
          type: 'number',
          defaultValue: 1000,
          min: 1,
          max: 4000,
          description: '最大回應長度'
        },
        {
          key: 'model',
          type: 'select',
          defaultValue: 'gpt-3.5-turbo',
          options: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
          description: '選擇GPT模型'
        }
      ],
      rateLimits: [
        {
          requests: 60,
          period: 60,
          burst: 10
        }
      ]
    }
  });

  const geminiConfig = await prisma.aIProviderConfig.upsert({
    where: { name: 'gemini' },
    update: {},
    create: {
      name: 'gemini',
      type: 'chat',
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
      apiKeyRequired: true,
      supportedParameters: [
        {
          key: 'temperature',
          type: 'number',
          defaultValue: 0.9,
          min: 0,
          max: 1,
          description: '控制回應的創造性'
        },
        {
          key: 'maxOutputTokens',
          type: 'number',
          defaultValue: 2048,
          min: 1,
          max: 8192,
          description: '最大輸出token數'
        },
        {
          key: 'model',
          type: 'select',
          defaultValue: 'gemini-pro',
          options: ['gemini-pro', 'gemini-pro-vision'],
          description: '選擇Gemini模型'
        }
      ],
      rateLimits: [
        {
          requests: 60,
          period: 60,
          burst: 5
        }
      ]
    }
  });

  const dalleConfig = await prisma.aIProviderConfig.upsert({
    where: { name: 'dall-e' },
    update: {},
    create: {
      name: 'dall-e',
      type: 'image',
      apiEndpoint: 'https://api.openai.com/v1',
      apiKeyRequired: true,
      supportedParameters: [
        {
          key: 'size',
          type: 'select',
          defaultValue: '1024x1024',
          options: ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'],
          description: '圖片尺寸'
        },
        {
          key: 'quality',
          type: 'select',
          defaultValue: 'standard',
          options: ['standard', 'hd'],
          description: '圖片品質'
        },
        {
          key: 'style',
          type: 'select',
          defaultValue: 'vivid',
          options: ['vivid', 'natural'],
          description: '圖片風格'
        },
        {
          key: 'n',
          type: 'number',
          defaultValue: 1,
          min: 1,
          max: 4,
          description: '生成圖片數量'
        }
      ],
      rateLimits: [
        {
          requests: 50,
          period: 60,
          burst: 5
        }
      ]
    }
  });

  console.log('種子數據完成:', {
    openaiConfig,
    geminiConfig,
    dalleConfig
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });