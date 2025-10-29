import axios from '@/api/axios.js'

export const getBoards = () => axios.get('/admin/boards')
export const deleteBoardById = (id) => axios.delete(`/admin/boards/${id}`)
