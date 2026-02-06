import api from '@/api/axios.js'

export const getPopularPosts = () => api.get('/navigation/popular-posts')

export const getPopularBoards = (boardLimit = 4, previewLimit = 5) =>
  api.get('/navigation/popular-boards', {
    params: { boardLimit, previewLimit }
  })
