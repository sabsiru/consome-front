<template>
  <section class="board-header">
    <div class="board-header__main">
      <h1 class="board-header__title" @click="goBoardPosts">{{ boardName }}</h1>
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
import { useRoute, useRouter } from 'vue-router'
const route = useRoute()
const router = useRouter()
const props = defineProps({
  boardName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  adminName: {
    type: String,
    default: '',
  },
})

const goBoardPosts = () => {
  const boardId = Number(route.params.boardId)

  // 현재 URL에 page/size/categoryId가 있다면 유지, 없으면 쿼리 없이 이동
  const q = {}
  if (route.query.page !== undefined) q.page = route.query.page
  if (route.query.size !== undefined) q.size = route.query.size
  if (route.query.categoryId !== undefined) q.categoryId = route.query.categoryId

  router.push({
    name: 'BoardPosts',
    params: { boardId },
    query: q,
  })
}
</script>
