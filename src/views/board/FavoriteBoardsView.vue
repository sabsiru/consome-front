<template>
  <main class="favorites-page">
    <div class="favorites-page__inner">
      <h1 class="favorites-page__title">즐겨찾기 게시판</h1>

      <div v-if="loading" class="favorites-page__empty">불러오는 중...</div>
      <div v-else-if="!favoriteStore.favorites.length" class="favorites-page__empty">
        즐겨찾기한 게시판이 없습니다.<br />
        <span class="favorites-page__hint">게시판 헤더의 ☆ 버튼으로 추가해보세요.</span>
      </div>

      <div v-else class="favorites-grid">
        <div
          v-for="board in favoriteStore.favorites"
          :key="board.boardId"
          class="board-card"
          @click="router.push(`/boards/${board.boardId}`)"
        >
          <div class="board-card__content">
            <h3 class="board-card__name">{{ board.name }}</h3>
            <p class="board-card__desc">{{ board.description }}</p>
          </div>
          <button
            class="board-card__fav-btn board-card__fav-btn--active"
            :disabled="favoriteStore.isPending(board.boardId)"
            @click.stop="favoriteStore.toggleFavorite(board.boardId)"
            title="즐겨찾기 해제"
          >★</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoriteStore } from '@/stores/favoriteStore.js'

const router = useRouter()
const favoriteStore = useFavoriteStore()
const loading = ref(true)

onMounted(async () => {
  await favoriteStore.fetchFavorites()
  loading.value = false
})
</script>

<style scoped>
.favorites-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.favorites-page__inner {
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: 40px var(--app-padding-x);
}

.favorites-page__title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 32px;
}

.favorites-page__empty {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: var(--text-muted);
  text-align: center;
  padding: 60px 0;
  line-height: 2;
}

.favorites-page__hint {
  font-size: 12px;
  color: var(--text-muted);
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.board-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
}

.board-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.board-card__content {
  flex: 1;
  min-width: 0;
}

.board-card__name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.board-card:hover .board-card__name {
  color: var(--accent);
}

.board-card__desc {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.board-card__fav-btn {
  font-size: 27px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
  flex-shrink: 0;
  line-height: 1;
  transition: color 0.15s ease, transform 0.15s ease;
}

.board-card__fav-btn:hover {
  color: var(--danger, #ef4444);
  transform: scale(1.2);
}

.board-card__fav-btn--active {
  color: var(--accent);
}

/* Responsive */
@media (max-width: 768px) {
  .favorites-page__inner {
    padding: 24px var(--app-padding-x);
  }

  .favorites-page__title {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .favorites-grid {
    grid-template-columns: 1fr;
  }
}
</style>
