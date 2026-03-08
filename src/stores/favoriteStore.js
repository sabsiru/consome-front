import { defineStore } from 'pinia'
import { addFavorite, removeFavorite, getFavoriteBoards } from '@/api/boardApi.js'

export const useFavoriteStore = defineStore('favorite', {
  state: () => ({
    favorites: [],
    favoriteIds: new Set(),
    pendingIds: new Set(), // 처리 중인 boardId (중복 요청 방어)
  }),
  getters: {
    isFavorited: (state) => (boardId) => state.favoriteIds.has(boardId),
    isPending: (state) => (boardId) => state.pendingIds.has(boardId),
  },
  actions: {
    async fetchFavorites() {
      try {
        const { data } = await getFavoriteBoards()
        this.favorites = data
        this.favoriteIds = new Set(data.map((b) => b.boardId))
      } catch (e) {
        console.error('[favoriteStore] 즐겨찾기 조회 실패', e)
      }
    },

    async toggleFavorite(boardId) {
      if (this.pendingIds.has(boardId)) return

      this.pendingIds.add(boardId)
      const wasFavorited = this.favoriteIds.has(boardId)

      // 낙관적 업데이트
      if (wasFavorited) {
        this.favoriteIds.delete(boardId)
        this.favorites = this.favorites.filter((b) => b.boardId !== boardId)
      } else {
        this.favoriteIds.add(boardId)
      }

      try {
        if (wasFavorited) {
          await removeFavorite(boardId)
        } else {
          await addFavorite(boardId)
          await this.fetchFavorites()
        }
      } catch (e) {
        // 롤백
        if (wasFavorited) {
          this.favoriteIds.add(boardId)
          await this.fetchFavorites()
        } else {
          this.favoriteIds.delete(boardId)
        }
        console.error('[favoriteStore] 즐겨찾기 토글 실패', e)
      } finally {
        this.pendingIds.delete(boardId)
      }
    },

    clear() {
      this.favorites = []
      this.favoriteIds = new Set()
      this.pendingIds = new Set()
    },
  },
})
