<template>
  <main class="popular">
    <div class="popular__header">
      <h1 class="popular__title">인기 게시글</h1>
    </div>

    <div class="popular__content">
      <div v-if="loading" class="popular__loading">불러오는 중...</div>
      <div v-else-if="!posts.length" class="popular__empty">인기 게시글이 없습니다</div>
      <table v-else class="popular__table">
        <thead>
          <tr>
            <th class="col-board">게시판</th>
            <th class="col-title">제목</th>
            <th class="col-nickname">작성자</th>
            <th class="col-views">조회</th>
            <th class="col-likes">추천</th>
            <th class="col-comments">댓글</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="post in posts"
            :key="post.postId"
            @click="goToPost(post)"
          >
            <td class="col-board">{{ post.boardName }}</td>
            <td class="col-title">{{ post.title }}</td>
            <td class="col-nickname">{{ post.nickname }}</td>
            <td class="col-views">{{ post.viewCount }}</td>
            <td class="col-likes">{{ post.likeCount }}</td>
            <td class="col-comments">{{ post.commentCount }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 페이징 -->
      <div v-if="totalPages > 1" class="popular__paging">
        <button
          class="popular__page-btn"
          :disabled="page === 0"
          @click="changePage(page - 1)"
        >← 이전</button>
        <button
          v-for="p in visiblePages"
          :key="p"
          class="popular__page-btn"
          :class="{ 'popular__page-btn--active': p === page }"
          @click="changePage(p)"
        >{{ p + 1 }}</button>
        <button
          class="popular__page-btn"
          :disabled="page >= totalPages - 1"
          @click="changePage(page + 1)"
        >다음 →</button>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getPopularPostsPaged } from '@/api/navigationApi.js'

const router = useRouter()
const route = useRoute()

const posts = ref([])
const loading = ref(true)
const page = ref(Number(route.query.page ?? 0))
const totalPages = ref(0)
const size = 50

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(0, page.value - 2)
  const end = Math.min(totalPages.value - 1, page.value + 2)
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const fetchPosts = async () => {
  loading.value = true
  try {
    const { data } = await getPopularPostsPaged(page.value, size)
    posts.value = data.content || []
    totalPages.value = data.totalPages || 0
  } catch (e) {
    console.error('인기 게시글 로드 실패:', e)
  } finally {
    loading.value = false
  }
}

const changePage = (p) => {
  page.value = p
  router.replace({ query: { page: p } })
}

const goToPost = (post) => {
  router.push(`/boards/${post.boardId}/posts/${post.postId}`)
}

watch(() => route.query.page, (val) => {
  page.value = Number(val ?? 0)
  fetchPosts()
})

onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.popular {
  min-height: calc(100vh - var(--app-header-height, 60px));
  background: var(--bg-primary);
  padding: 40px var(--app-padding-x, 20px);
}

.popular__header {
  max-width: var(--app-max-width, 1200px);
  margin: 0 auto 24px;
}

.popular__title {
  font-family: 'Outfit', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.popular__content {
  max-width: var(--app-max-width, 1200px);
  margin: 0 auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.popular__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.popular__table thead {
  background: var(--bg-tertiary);
}

.popular__table th,
.popular__table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.popular__table th {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: left;
  white-space: nowrap;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.popular__table tbody tr {
  background: var(--bg-secondary);
  transition: background 0.15s ease;
  cursor: pointer;
}

.popular__table tbody tr:nth-child(even) {
  background: var(--bg-tertiary);
}

.popular__table tbody tr:hover {
  background: var(--bg-hover);
}

.popular__table .col-board {
  width: 80px;
  color: var(--accent);
  font-size: 12px;
}

.popular__table .col-title {
  color: var(--text-primary);
}

.popular__table .col-nickname {
  width: 100px;
  color: var(--text-secondary);
  font-size: 12px;
}

.popular__table .col-views,
.popular__table .col-likes,
.popular__table .col-comments {
  width: 60px;
  text-align: center;
  color: var(--text-muted);
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

/* Paging */
.popular__paging {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.popular__page-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.popular__page-btn:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.popular__page-btn--active {
  background: var(--accent);
  color: var(--bg-primary);
  border-color: var(--accent);
}

.popular__page-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.popular__loading,
.popular__empty {
  text-align: center;
  padding: 32px 16px;
  color: var(--text-muted);
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .popular__table .col-nickname {
    display: none;
  }
}

@media (max-width: 480px) {
  .popular {
    padding: 20px var(--app-padding-x, 12px);
  }

  .popular__table .col-likes,
  .popular__table .col-comments,
  .popular__table .col-views {
    display: none;
  }

  .popular__table th,
  .popular__table td {
    padding: 8px 8px;
    font-size: 12px;
  }
}
</style>
