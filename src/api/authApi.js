import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// refresh 요청은 별도 axios 인스턴스 사용 (인터셉터 순환 방지)
const authAxios = axios.create({ baseURL, withCredentials: true })

export const refreshToken = (refreshToken) =>
  authAxios.post('/auth/refresh', { refreshToken })

export const logoutApi = (accessToken) =>
  authAxios.post('/auth/logout', null, {
    headers: { Authorization: `Bearer ${accessToken}` }
  })
