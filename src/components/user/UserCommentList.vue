<template>
  <div class="user-comment-list">
    <table class="user-table">
      <thead>
        <tr>
          <th class="col-board">게시판</th>
          <th class="col-post">원글</th>
          <th class="col-content">댓글 내용</th>
          <th class="col-stats">추천</th>
          <th class="col-date">작성일</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="comment in comments"
          :key="comment.commentId"
          class="user-table__row"
          @click="emit('comment-click', comment)"
        >
          <td class="col-board">{{ comment.boardName }}</td>
          <td class="col-post">{{ truncate(comment.postTitle, 20) }}</td>
          <td class="col-content">{{ truncate(comment.content, 30) }}</td>
          <td class="col-stats">{{ comment.likeCount }}</td>
          <td class="col-date">{{ formatDate(comment.createdAt) }}</td>
        </tr>
        <tr v-if="comments.length === 0">
          <td colspan="5" class="user-table__empty">작성한 댓글이 없습니다.</td>
        </tr>
      </tbody>
    </table>

    <div v-if="totalPages > 1" class="pagination">
      <button
        v-for="p in totalPages"
        :key="p"
        class="pagination__btn"
        :class="{ 'is-active': p - 1 === page }"
        @click="loadComments(p - 1)"
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

const emit = defineEmits(['comment-click'])

const comments = ref([])
const page = ref(0)
const totalPages = ref(0)

const loadComments = async (targetPage = 0) => {
  const res = await api.get(`/users/${props.userId}/comments`, {
    params: { page: targetPage, size: 10 },
  })
  comments.value = res.data.comments
  page.value = res.data.page
  totalPages.value = res.data.totalPages
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

const truncate = (str, len) => {
  if (!str) return ''
  return str.length > len ? str.slice(0, len) + '...' : str
}

onMounted(() => {
  loadComments()
})

watch(() => props.userId, () => {
  loadComments()
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
  width: 100px;
}

.col-post {
  width: 150px;
}

.col-content {
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
