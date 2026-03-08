import api from '@/api/axios.js'

export const addFavorite = (boardId) => api.post(`/boards/${boardId}/favorites`)
export const removeFavorite = (boardId) => api.delete(`/boards/${boardId}/favorites`)
export const getFavoriteBoards = () => api.get('/boards/favorites')
