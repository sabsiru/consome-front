import axios from 'axios'
import { refreshToken as refreshTokenApi } from '@/api/authApi.js'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
},
  (error) => Promise.reject(error))

// Silent Refresh: 401 시 자동 토큰 갱신 후 재시도
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isLoginRequest = originalRequest.url?.includes('/users/login')
      const isRefreshRequest = originalRequest.url?.includes('/auth/refresh')

      if (isLoginRequest || isRefreshRequest) {
        return Promise.reject(error)
      }

      const storedRefreshToken = localStorage.getItem('refreshToken')
      if (!storedRefreshToken) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // 이미 갱신 중이면 큐에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await refreshTokenApi(storedRefreshToken)

        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)

        // Pinia store도 업데이트 (동적 import로 순환 의존 방지)
        const { useUserStore } = await import('@/stores/userStore.js')
        const store = useUserStore()
        store.setTokens(data.accessToken, data.refreshToken)

        processQueue(null, data.accessToken)

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
