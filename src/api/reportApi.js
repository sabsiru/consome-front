import api from '@/api/axios.js'

// 사용자 신고
export const createReport = (userId, targetType, targetId, reason, description = '') =>
  api.post('/reports', { targetType, targetId, reason, description }, { params: { userId } })

// 내 신고 목록
export const getMyReports = (userId, page = 0, size = 5) =>
  api.get('/reports/mine', { params: { userId, page, size } })

// 관리자 신고 관리 - 그룹화된 목록
export const getGroupedReports = (status = null, page = 0, size = 20) =>
  api.get('/admin/reports', { params: { status, page, size } })

// 특정 대상의 전체 신고자 목록
export const getReportersByTarget = (targetType, targetId) =>
  api.get(`/admin/reports/${targetType}/${targetId}/reporters`)

// 개별 신고 목록 (기존 방식)
export const getReports = (status = null, targetType = null, targetUserId = null, page = 0, size = 20) =>
  api.get('/admin/reports/all', { params: { status, targetType, targetUserId, page, size } })

export const getReportDetail = (reportId) =>
  api.get(`/admin/reports/${reportId}`)

export const resolveReport = (reportId, userId, suspensionType = null) =>
  api.patch(`/admin/reports/${reportId}/resolve`, null, { params: { userId, suspensionType } })

export const rejectReport = (reportId, userId) =>
  api.patch(`/admin/reports/${reportId}/reject`, null, { params: { userId } })
