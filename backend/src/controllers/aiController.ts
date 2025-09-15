import { Request, Response } from 'express';
import { AIServiceFactory } from '../services/ai/AIServiceFactory';
import { AIServiceError } from '../types';

const aiFactory = new AIServiceFactory();

/**
 * 發送聊天訊息
 */
export const sendChatMessage = async (req: Request, res: Response) => {
  try {
    const { message, provider = 'openai', parameters = {} } = req.body;

    const chatService = aiFactory.createChatService(provider);
    const response = await chatService.sendMessage(message, parameters);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Chat message error:', error);
    
    if (error instanceof AIServiceError) {
      return res.status(400).json({
        success: false,
        error: {
          type: error.type,
          message: error.message,
          provider: error.provider,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
};

/**
 * 發送帶上下文的聊天訊息
 */
export const sendChatMessageWithContext = async (req: Request, res: Response) => {
  try {
    const { messages, provider = 'openai', parameters = {} } = req.body;

    const chatService = aiFactory.createChatService(provider);
    const response = await chatService.sendMessageWithContext(messages, parameters);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Chat context message error:', error);
    
    if (error instanceof AIServiceError) {
      return res.status(400).json({
        success: false,
        error: {
          type: error.type,
          message: error.message,
          provider: error.provider,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
};

/**
 * 生成圖片
 */
export const generateImage = async (req: Request, res: Response) => {
  try {
    const { prompt, provider = 'openai', parameters = {} } = req.body;

    const imageService = aiFactory.createImageService(provider);
    const response = await imageService.generateImage(prompt, parameters);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    
    if (error instanceof AIServiceError) {
      return res.status(400).json({
        success: false,
        error: {
          type: error.type,
          message: error.message,
          provider: error.provider,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
};

/**
 * 創建圖片變體
 */
export const createImageVariation = async (req: Request, res: Response) => {
  try {
    const { provider = 'openai', parameters = {} } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'MISSING_FILE',
          message: 'Image file is required',
        },
      });
    }

    const imageService = aiFactory.createImageService(provider);
    
    // Convert buffer to File-like object
    const file = new File([imageFile.buffer], imageFile.originalname, {
      type: imageFile.mimetype,
    });

    const response = await imageService.createVariation(file, parameters);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Image variation error:', error);
    
    if (error instanceof AIServiceError) {
      return res.status(400).json({
        success: false,
        error: {
          type: error.type,
          message: error.message,
          provider: error.provider,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
};

/**
 * 編輯圖片
 */
export const editImage = async (req: Request, res: Response) => {
  try {
    const { prompt, provider = 'openai', parameters = {} } = req.body;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!files?.image?.[0] || !files?.mask?.[0]) {
      return res.status(400).json({
        success: false,
        error: {
          type: 'MISSING_FILES',
          message: 'Both image and mask files are required',
        },
      });
    }

    const imageFile = files.image[0];
    const maskFile = files.mask[0];

    const imageService = aiFactory.createImageService(provider);
    
    // Convert buffers to File-like objects
    const image = new File([imageFile.buffer], imageFile.originalname, {
      type: imageFile.mimetype,
    });
    const mask = new File([maskFile.buffer], maskFile.originalname, {
      type: maskFile.mimetype,
    });

    const response = await imageService.editImage(image, mask, prompt, parameters);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error('Image edit error:', error);
    
    if (error instanceof AIServiceError) {
      return res.status(400).json({
        success: false,
        error: {
          type: error.type,
          message: error.message,
          provider: error.provider,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        type: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    });
  }
};