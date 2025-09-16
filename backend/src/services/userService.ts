import { PrismaClient, User, UserPreferences } from '@prisma/client';
import { hashPassword, verifyPassword } from '../utils/auth';
import { CreateUserData, LoginData } from '../types';

const prisma = new PrismaClient();

export class UserService {
  /**
   * 創建新用戶
   */
  async createUser(userData: CreateUserData): Promise<User> {
    const { email, username, password } = userData;

    // 檢查用戶是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('該電子郵件已被註冊');
      }
      if (existingUser.username === username) {
        throw new Error('該用戶名已被使用');
      }
    }

    // 哈希密碼
    const hashedPassword = await hashPassword(password);

    // 創建用戶和預設偏好設定
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        preferences: {
          create: {
            theme: 'light',
            defaultAIProvider: 'openai',
            defaultParameters: {},
            language: 'zh-TW',
          },
        },
      },
      include: {
        preferences: true,
      },
    });

    return user;
  }

  /**
   * 用戶登入驗證
   */
  async authenticateUser(loginData: LoginData): Promise<User> {
    const { email, password } = loginData;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      throw new Error('電子郵件或密碼錯誤');
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('電子郵件或密碼錯誤');
    }

    return user;
  }

  /**
   * 根據ID獲取用戶
   */
  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        preferences: true,
      },
    });
  }

  /**
   * 根據電子郵件獲取用戶
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true,
      },
    });
  }

  /**
   * 更新用戶偏好設定
   */
  async updateUserPreferences(
    userId: string,
    preferences: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: {
          upsert: {
            create: {
              theme: preferences.theme || 'light',
              defaultAIProvider: preferences.defaultAIProvider || 'openai',
              defaultParameters: preferences.defaultParameters || {},
              language: preferences.language || 'zh-TW',
            },
            update: preferences,
          },
        },
      },
      include: {
        preferences: true,
      },
    });

    return user;
  }

  /**
   * 刪除用戶
   */
  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * 獲取用戶統計信息
   */
  async getUserStats(userId: string) {
    const [conversationCount, imageCount, videoCount] = await Promise.all([
      prisma.conversation.count({ where: { userId } }),
      prisma.generatedImage.count({ where: { userId } }),
      prisma.generatedVideo.count({ where: { userId } }),
    ]);

    return {
      conversationCount,
      imageCount,
      videoCount,
    };
  }
}
