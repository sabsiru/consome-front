import axios from 'axios';

// 환경변수: .env 파일에서 VITE_API_URL로 관리(아래 2단계에서 설정)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  withCredentials: true, // 추후 인증(쿠키/토큰) 시 유용
});

// 요청/응답 인터셉터는 필요해질 때 추가
export default api;
