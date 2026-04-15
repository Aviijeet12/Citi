import axios, { AxiosInstance, AxiosError } from 'axios'

interface ApiResponse<T> {
  data?: T
  item?: T
  items?: T[]
  status?: number
  message?: string
}

interface ErrorResponse {
  message: string
  code: string
}

class ApiClient {
  private instance: AxiosInstance
  private baseURL =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'http://localhost:3001/api'

  constructor() {
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ErrorResponse>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      },
    )
  }

  async get<T>(url: string) {
    try {
      const response = await this.instance.get<ApiResponse<T>>(url)
      return this.unwrapResponse(response.data)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async post<T>(url: string, data?: any) {
    try {
      const response = await this.instance.post<ApiResponse<T>>(url, data)
      return this.unwrapResponse(response.data)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async put<T>(url: string, data?: any) {
    try {
      const response = await this.instance.put<ApiResponse<T>>(url, data)
      return this.unwrapResponse(response.data)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async delete<T>(url: string) {
    try {
      const response = await this.instance.delete<ApiResponse<T>>(url)
      return this.unwrapResponse(response.data)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getRaw<T>(url: string) {
    try {
      const response = await this.instance.get<T>(url)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async postRaw<T>(url: string, data?: any) {
    try {
      const response = await this.instance.post<T>(url, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async putRaw<T>(url: string, data?: any) {
    try {
      const response = await this.instance.put<T>(url, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteRaw<T>(url: string) {
    try {
      const response = await this.instance.delete<T>(url)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  private unwrapResponse<T>(payload: ApiResponse<T>) {
    if (payload.data !== undefined) {
      return payload.data
    }
    if (payload.item !== undefined) {
      return payload.item
    }
    if (payload.items !== undefined) {
      return payload.items as T
    }
    return payload as T
  }

  private handleError(error: any) {
    if (error.response) {
      return {
        status: error.response.status,
        message: error.response.data?.message || 'An error occurred',
        data: error.response.data,
      }
    }
    return {
      status: 0,
      message: error.message || 'Network error',
    }
  }
}

export const apiClient = new ApiClient()
