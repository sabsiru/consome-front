import api from '@/api/axios.js'

// 사용자 검색
export const searchUsers = (nickname) =>
  api.get('/users/search', { params: { nickname } })

// 쪽지
export const sendMessage = (receiverId, content, point = 0) =>
  api.post('/messages', { receiverId, content, point })

export const getReceivedMessages = (page = 0, size = 20) =>
  api.get('/messages/received', { params: { page, size } })

export const getSentMessages = (page = 0, size = 20) =>
  api.get('/messages/sent', { params: { page, size } })

export const readMessage = (messageId) =>
  api.get(`/messages/${messageId}`)

export const deleteMessage = (messageId) =>
  api.delete(`/messages/${messageId}`)

export const getUnreadCount = () =>
  api.get('/messages/unread-count')

// 차단
export const blockUser = (blockedId) =>
  api.post(`/messages/blocks/${blockedId}`)

export const unblockUser = (blockedId) =>
  api.delete(`/messages/blocks/${blockedId}`)

export const getBlockList = (page = 0, size = 20) =>
  api.get('/messages/blocks', { params: { page, size } })
