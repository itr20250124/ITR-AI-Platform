/**
 * 本地存儲工具類
 */
export class LocalStorage {
  /**
   * 設置項目
   */
  static setItem<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  }

  /**
   * 獲取項目
   */
  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key "${key}":`, error);
      return null;
    }
  }

  /**
   * 移除項目
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage key "${key}":`, error);
    }
  }

  /**
   * 清空所有項目
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  /**
   * 檢查是否支持localStorage
   */
  static isSupported(): boolean {
    try {
      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 主題相關的本地存儲
 */
export const themeStorage = {
  getTheme: (): 'light' | 'dark' | null => {
    return LocalStorage.getItem<'light' | 'dark'>('theme');
  },

  setTheme: (theme: 'light' | 'dark'): void => {
    LocalStorage.setItem('theme', theme);
  },

  removeTheme: (): void => {
    LocalStorage.removeItem('theme');
  },
};

/**
 * 用戶偏好設定的本地存儲
 */
export const userPreferencesStorage = {
  getPreferences: () => {
    return LocalStorage.getItem('userPreferences');
  },

  setPreferences: (preferences: any): void => {
    LocalStorage.setItem('userPreferences', preferences);
  },

  removePreferences: (): void => {
    LocalStorage.removeItem('userPreferences');
  },
};

/**
 * 認證token的本地存儲
 */
export const authStorage = {
  getToken: (): string | null => {
    return LocalStorage.getItem<string>('authToken');
  },

  setToken: (token: string): void => {
    LocalStorage.setItem('authToken', token);
  },

  removeToken: (): void => {
    LocalStorage.removeItem('authToken');
  },
};
