import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * 創建驗證中間件
 */
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '輸入數據驗證失敗',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        },
      });
    }

    next();
  };
}

/**
 * 用戶註冊驗證規則
 */
export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '請輸入有效的電子郵件地址',
    'any.required': '電子郵件為必填項',
  }),
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': '用戶名只能包含字母和數字',
    'string.min': '用戶名至少需要3個字符',
    'string.max': '用戶名不能超過30個字符',
    'any.required': '用戶名為必填項',
  }),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.min': '密碼至少需要6個字符',
      'string.pattern.base': '密碼必須包含至少一個小寫字母、一個大寫字母和一個數字',
      'any.required': '密碼為必填項',
    }),
});

/**
 * 用戶登入驗證規則
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': '請輸入有效的電子郵件地址',
    'any.required': '電子郵件為必填項',
  }),
  password: Joi.string().required().messages({
    'any.required': '密碼為必填項',
  }),
});

/**
 * 用戶偏好設定驗證規則
 */
export const userPreferencesSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark').optional(),
  defaultAIProvider: Joi.string().optional(),
  defaultParameters: Joi.object().optional(),
  language: Joi.string().optional(),
});
