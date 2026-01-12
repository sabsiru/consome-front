<template>
  <div class="board-post-write">
    <h2>{{ boardName }}</h2>

    <form @submit.prevent="submit">
      <div class="form-row">
        <label for="title">제목</label>
        <input id="title" v-model="title" type="text" placeholder="제목을 입력하세요." />
      </div>

      <!-- 🔹 카테고리: DB 조회 결과를 select로 표시 -->
      <div class="form-row">
        <label for="category">카테고리</label>
        <select id="category" v-model="categoryId">
          <option value="">카테고리를 선택하세요.</option>
          <option v-for="category in categories" :key="category.id" :value="String(category.id)">
            {{ category.name }}
          </option>
        </select>
      </div>

      <div class="form-row">
        <label for="content">내용</label>
        <textarea id="content" v-model="content" rows="10" placeholder="내용을 입력하세요." />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="actions">
        <button type="button" @click="goBack">목록으로</button>
        <button type="submit" :disabled="loading">
          {{ loading ? '작성 중...' : '등록' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/axios'
import { useUserStore } from '@/stores/userStore' // refUserId 용

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const boardId = computed(() => Number(route.params.boardId))
const boardName = ref('')
const categoryId = ref('') // select에서 선택한 categoryId (string)
const categories = ref([]) // DB에서 조회한 카테고리 목록

const title = ref('')
const content = ref('')
const loading = ref(false)
const error = ref('')

// 🔹 카테고리 목록 조회
const loadCategories = async () => {
  try {
    const res = await api.get(`/boards/${boardId.value}/categories`)
    categories.value = res.data
  } catch (e) {
    console.error('[PostView] 카테고리 목록 조회 실패', e)
  }
}
const getBoardName = async () => {
  const res = await api.get(`/boards/${boardId.value}`)
  boardName.value = res.data
}
onMounted(() => {
  loadCategories()
  getBoardName()
})

const submit = async () => {
  if (!title.value.trim()) {
    error.value = '제목을 입력하세요.'
    return
  }
  if (!content.value.trim()) {
    error.value = '내용을 입력하세요.'
    return
  }
  if (!categoryId.value) {
    error.value = '카테고리를 선택하세요.'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const payload = {
      userId: userStore.userId, // userStore 구조에 맞게 필요시 조정
      boardId: boardId.value,
      categoryId: Number(categoryId.value),
      title: title.value,
      content: content.value,
    }
    console.log('[PostView] payload', payload)
    console.log('userStore', userStore)
    const res = await api.post('/posts', payload) // baseURL = /api/v1 가정
    const created = res.data // PostResponse

    // 작성 후: 일단 목록으로 이동
    await router.push({ name: 'BoardPosts', params: { boardId: boardId.value } })

    // 상세 페이지가 준비되면 이런 식으로도 변경 가능:
    // await router.push({ path: `/posts/${created.postId}` })
  } catch (e) {
    console.error('[PostView] 게시글 작성 실패', e)
    error.value = '게시글 작성에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'BoardPosts', params: { boardId: boardId.value } })
}
</script>

<style scoped>
.board-post-write {
  padding: 80px 24px 24px;
  max-width: 800px;
  margin: 0 auto;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

label {
  margin-bottom: 4px;
  font-weight: 500;
}

input,
textarea,
select {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  font-size: 14px;
}

.error {
  color: #d33;
  margin-bottom: 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
