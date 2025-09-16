import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { APIResponse } from '../types'
import { authStorage } from '../utils/localStorage'

/**
 * API客戶端類
 */
class APIClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 請求攔截器 - 添加認證token
    this.instance.interceptors.request.use(
      config => {
        const token = authStorage.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      error => {
        return Promise.reject(error)
      }
    )

    // 響應攔截器 - 處理錯誤
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      error => {
        if (error.response?.status === 401) {
          // Token過期，清除本地存儲
          authStorage.removeToken()
          // 可以在這裡觸發登出事件
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string): Promise<APIResponse<T>> {
    const response = await this.instance.get(url)
    return response.data
  }

  async post<T>(url: string, data?: any): Promise<APIResponse<T>> {
    const response = await this.instance.post(url, data)
    return response.data
  }

  async put<T>(url: string, data?: any): Promise<APIResponse<T>> {
    const response = await this.instance.put(url, data)
    return response.data
  }

  async delete<T>(url: string): Promise<APIResponse<T>> {
    const response = await this.instance.delete(url)
    return response.data
  }
}

// 創建全域API客戶端實例
export const apiClient = new APIClient()
