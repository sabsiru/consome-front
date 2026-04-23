import axios from '@/api/axios.js'

// 관리자 통계 (누적방문자, 오늘방문자, 현재접속자)
export const getAdminStatistics = () => axios.get('/admin/statistics')

// 현재 접속자 수 (공개)
export const getOnlineCount = () => axios.get('/statistics/online-count')

// 최근 방문 게시판 (로그인 사용자)
export const getVisitedBoards = () => axios.get('/users/me/visited-boards')

// 인기 검색어 TOP N (공개)
export const getPopularKeywords = (period = 'hour', limit = 10) =>
  axios.get('/statistics/popular-keywords', { params: { period, limit } })

// 시간대별 활동량 (관리자 전용) — type: ALL|VISIT|POST|COMMENT|POST_LIKE|POST_DISLIKE|COMMENT_LIKE|COMMENT_DISLIKE
export const getHourlyActivity = (days = 7, type = 'ALL') =>
  axios.get('/admin/statistics/hourly-activity', { params: { days, type } })
