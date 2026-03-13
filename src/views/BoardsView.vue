<template>
  <main class="boards-page">
    <div class="boards-page__inner">
      <h1 class="boards-page__title">전체 게시판</h1>

      <div v-if="loading" class="boards-page__loading">불러오는 중...</div>
      <div v-else-if="!sections.length" class="boards-page__empty">등록된 게시판이 없습니다</div>

      <div v-else class="sections">
        <section
          v-for="section in sections"
          :key="section.id"
          class="section"
          :class="{ 'section--admin-only': section.adminOnly }"
        >
          <h2 class="section__title">
            <span v-if="section.adminOnly" class="section__badge">ADMIN</span>
            {{ section.name }}
            <span class="section__count">({{ section.boards.length }})</span>
          </h2>
          <div class="section__boards">
            <div
              v-for="board in section.boards"
              :key="board.id"
              class="board-card"
              @click="goToBoard(board.id)"
            >
              <div class="board-card__content">
                <h3 class="board-card__name">{{ board.name }}</h3>
                <p class="board-card__desc">{{ board.description }}</p>
              </div>
              <button
                v-if="userId"
                class="board-card__fav-btn"
                :class="{ 'board-card__fav-btn--active': favoriteStore.isFavorited(board.id) }"
                :disabled="favoriteStore.isPending(board.id)"
                @click.stop="favoriteStore.toggleFavorite(board.id)"
                :title="favoriteStore.isFavorited(board.id) ? '즐겨찾기 해제' : '즐겨찾기 추가'"
              >
                {{ favoriteStore.isFavorited(board.id) ? '★' : '☆' }}
              </button>
            </div>
          </div>
          <div v-if="!section.boards.length" class="section__empty">
            등록된 게시판이 없습니다
          </div>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { getSections } from '@/api/sectionApi.js'
import { useUserStore } from '@/stores/userStore.js'
import { useFavoriteStore } from '@/stores/favoriteStore.js'

const router = useRouter()
const sections = ref([])
const loading = ref(true)

const userStore = useUserStore()
const { userId } = storeToRefs(userStore)
const favoriteStore = useFavoriteStore()

const fetchSections = async () => {
  try {
    const { data } = await getSections()
    sections.value = data
  } catch (e) {
    console.error('[BoardsView] 섹션 조회 실패', e)
  } finally {
    loading.value = false
  }
}

const goToBoard = (id) => {
  router.push(`/boards/${id}`)
}

onMounted(fetchSections)
</script>

<style scoped>
.boards-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.boards-page__inner {
  max-width: var(--app-max-width);
  margin: 0 auto;
  padding: 40px var(--app-padding-x);
}

.boards-page__title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 32px;
}

.boards-page__loading,
.boards-page__empty {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  color: var(--text-muted);
  text-align: center;
  padding: 60px 0;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.section__title {
  font-family: 'JetBrains Mono', monospace;
  font-size: 18px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.section__count {
  font-size: 14px;
  font-weight: 400;
  color: var(--text-muted);
}

.section__boards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.section__empty {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
  padding: 20px;
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
  color: var(--accent);
  transform: scale(1.2);
}

.board-card__fav-btn--active {
  color: var(--accent);
}

/* Admin Only Section */
.section--admin-only {
  background: rgba(59, 130, 246, 0.06);
  border-left: 3px solid var(--accent);
  padding: 16px;
  border-radius: 8px;
  margin-left: -16px;
  padding-left: 16px;
}

.section__badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: middle;
}

/* Responsive */
@media (max-width: 768px) {
  .boards-page__inner {
    padding: 24px var(--app-padding-x);
  }

  .boards-page__title {
    font-size: 20px;
    margin-bottom: 24px;
  }

  .sections {
    gap: 28px;
  }

  .section__boards {
    grid-template-columns: 1fr;
  }

  .section--admin-only {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .board-card {
    padding: 14px;
  }

  .board-card__name {
    font-size: 14px;
  }

  .board-card__desc {
    font-size: 12px;
  }
}
</style>
