<template>
  <div class="user-post-list">
    <table class="user-table">
      <thead>
        <tr>
          <th class="col-board">게시판</th>
          <th class="col-title">제목</th>
          <th class="col-stats">조회</th>
          <th class="col-stats">추천</th>
          <th class="col-stats">댓글</th>
          <th class="col-date">작성일</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="post in posts"
          :key="post.postId"
          class="user-table__row"
          @click="emit('post-click', post)"
        >
          <td class="col-board">{{ post.boardName }}</td>
          <td class="col-title">{{ post.title }}</td>
          <td class="col-stats">{{ post.viewCount }}</td>
          <td class="col-stats">{{ post.likeCount }}</td>
          <td class="col-stats">{{ post.commentCount }}</td>
          <td class="col-date">{{ formatDate(post.createdAt) }}</td>
        </tr>
        <tr v-if="posts.length === 0">
          <td colspan="6" class="user-table__empty">작성한 게시글이 없습니다.</td>
        </tr>
      </tbody>
    </table>

    <div v-if="totalPages > 1" class="pagination">
      <button
        v-for="p in totalPages"
        :key="p"
        class="pagination__btn"
        :class="{ 'is-active': p - 1 === page }"
        @click="loadPosts(p - 1)"
      >
        {{ p }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '@/api/axios.js'

const props = defineProps({
  userId: { type: Number, required: true },
})

const emit = defineEmits(['post-click'])

const posts = ref([])
const page = ref(0)
const totalPages = ref(0)

const loadPosts = async (targetPage = 0) => {
  const res = await api.get(`/users/${props.userId}/posts`, {
    params: { page: targetPage, size: 10 },
  })
  posts.value = res.data.posts
  page.value = res.data.page
  totalPages.value = res.data.totalPages
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  loadPosts()
})

watch(() => props.userId, () => {
  loadPosts()
})
</script>

<style scoped>
.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.user-table th {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-secondary);
}

.user-table__row {
  cursor: pointer;
}

.user-table__row:hover {
  background: var(--bg-secondary);
}

.col-board {
  width: 120px;
}

.col-title {
  min-width: 200px;
}

.col-stats {
  width: 60px;
  text-align: center;
}

.col-date {
  width: 100px;
  color: var(--text-secondary);
  font-size: 13px;
}

.user-table__empty {
  text-align: center;
  color: var(--text-tertiary);
  padding: 40px 0;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
}

.pagination__btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  cursor: pointer;
  border-radius: 4px;
}

.pagination__btn.is-active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}
</style>
