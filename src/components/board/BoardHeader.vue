<template>
  <section class="board-header">
    <div class="board-header__main">
      <div class="board-header__title-row">
        <h1 class="board-header__title" @click="goBoardPosts">{{ boardName }}</h1>
        <button
          v-if="userId && boardId"
          class="board-header__fav-btn"
          :class="{ 'board-header__fav-btn--active': isFavorited }"
          :disabled="isPending"
          @click="handleToggleFavorite"
          :title="isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'"
        >
          {{ isFavorited ? '★' : '☆' }}
        </button>
      </div>
      <p v-if="description" class="board-header__desc">
        {{ description }}
      </p>
    </div>

    <div v-if="adminName" class="board-header__meta">
      관리자: <span class="board-header__admin">{{ adminName }}</span>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/userStore.js'
import { useFavoriteStore } from '@/stores/favoriteStore.js'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  boardName: { type: String, required: true },
  description: { type: String, default: '' },
  adminName: { type: String, default: '' },
  boardId: { type: Number, default: null },
})

const userStore = useUserStore()
const { userId } = storeToRefs(userStore)

const favoriteStore = useFavoriteStore()
const isFavorited = computed(() => favoriteStore.isFavorited(props.boardId))
const isPending = computed(() => favoriteStore.isPending(props.boardId))

const handleToggleFavorite = () => {
  if (!props.boardId) return
  favoriteStore.toggleFavorite(props.boardId)
}

const goBoardPosts = () => {
  const boardId = Number(route.params.boardId)
  const q = {}
  if (route.query.page !== undefined) q.page = route.query.page
  if (route.query.size !== undefined) q.size = route.query.size
  if (route.query.categoryId !== undefined) q.categoryId = route.query.categoryId

  router.push({ name: 'BoardPosts', params: { boardId }, query: q })
}
</script>

<style scoped>
.board-header__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.board-header__fav-btn {
  font-size: 27px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0 4px;
  line-height: 1;
  transition: color 0.15s ease, transform 0.15s ease;
}

.board-header__fav-btn:hover:not(:disabled) {
  color: var(--accent);
  transform: scale(1.2);
}

.board-header__fav-btn--active {
  color: var(--accent);
}

.board-header__fav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
