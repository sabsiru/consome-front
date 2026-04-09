import axios from '@/api/axios.js'

export const getBoards = () => axios.get('/admin/boards')
export const deleteBoardById = (id) => axios.delete(`/admin/boards/${id}`)

// 사용자 제재
export const suspendUser = (userId, type, reason) =>
  axios.post(`/admin/manage/users/${userId}/suspend`, { type, reason })

export const unsuspendUser = (userId) =>
  axios.delete(`/admin/manage/users/${userId}/suspend`)
