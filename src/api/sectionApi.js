import api from '@/api/axios.js'

// 공개 API
export const getSections = () => api.get('/sections')

// 관리자 API
export const getAdminSections = () => api.get('/admin/sections')
export const createSection = (name, adminOnly = false) => api.post('/admin/sections', { name, adminOnly })
export const updateSection = (id, name, adminOnly) => api.put(`/admin/sections/${id}`, { name, adminOnly })
export const deleteSection = (id) => api.delete(`/admin/sections/${id}`)
export const reorderSections = (orders) => api.put('/admin/sections/reorder', { orders })
