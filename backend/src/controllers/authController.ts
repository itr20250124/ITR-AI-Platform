import { Response } from 'express';
import { UserService } from '../services/userService';
import { generateToken } from '../utils/auth';
import { AuthenticatedRequest, CreateUserData, LoginData } from '../types';

const userService = new UserService();

/**
 * 用戶註冊
 */
export async function register(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userData: CreateUserData = req.body;

    const user = await userService.createUser(userData);

    // 生成JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // 移除密碼字段
    const { password, ...userWithoutPassword } = user;

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: '註冊成功',
    });
  } catch (error) {
    console.error('Registration error:', error);

    res.status(400).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: error instanceof Error ? error.message : '註冊失敗',
      },
    });
  }
}

/**
 * 用戶登入
 */
export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const loginData: LoginData = req.body;

    const user = await userService.authenticateUser(loginData);

    // 生成JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // 移除密碼字段
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
      message: '登入成功',
    });
  } catch (error) {
    console.error('Login error:', error);

    res.status(401).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: error instanceof Error ? error.message : '登入失敗',
      },
    });
  }
}

/**
 * 獲取當前用戶信息
 */
export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未認證的請求',
        },
      });
    }

    const user = await userService.getUserById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用戶不存在',
        },
      });
    }

    // 獲取用戶統計信息
    const stats = await userService.getUserStats(user.id);

    // 移除密碼字段
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        stats,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '獲取用戶信息失敗',
      },
    });
  }
}

/**
 * 更新用戶偏好設定
 */
export async function updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未認證的請求',
        },
      });
    }

    const preferences = req.body;
    const user = await userService.updateUserPreferences(req.user.userId, preferences);

    // 移除密碼字段
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
      message: '偏好設定更新成功',
    });
  } catch (error) {
    console.error('Update preferences error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: '更新偏好設定失敗',
      },
    });
  }
}

/**
 * 用戶登出 (客戶端處理token清除)
 */
export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.json({
    success: true,
    message: '登出成功',
  });
}
