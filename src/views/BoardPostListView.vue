<template>
  <BoardPostList
    :board-id="boardId"
    :page="page"
    :size="size"
    :category-id="categoryId"
    @loaded="onLoaded"
    @page-change="onPageChange"
    @category-change="onCategoryChange"
    @post-click="onPostClick"
    @write-click="onWriteClick"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BoardPostList from '@/components/board/BoardPostList.vue'

const route = useRoute()
const router = useRouter()

const boardId = computed(() => Number(route.params.boardId))
const page = computed(() => Number(route.query.page ?? 0))
const size = computed(() => Number(route.query.size ?? 20))
const categoryId = computed(() => {
  const v = route.query.categoryId
  return v === undefined || v === null || v === '' ? null : Number(v)
})

const boardName = ref('')

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

const buildQuery = ({ page, size, categoryId }) => {
  const q = { ...route.query }

  delete q.page
  delete q.size
  delete q.categoryId

  // 기본값이 아니면만 query에 포함
  if (page !== DEFAULT_PAGE) q.page = String(page)
  if (size !== DEFAULT_SIZE) q.size = String(size)
  if (categoryId != null) q.categoryId = String(categoryId)

  return q
}

const onLoaded = (payload) => {
  boardName.value = payload?.boardName ?? ''
}

const onPageChange = (nextPage) => {
  router.push({
    name: route.name,
    params: route.params,
    query: buildQuery({
      page: nextPage,
      size: size.value,
      categoryId: categoryId.value,
    }),
  })
}

const onCategoryChange = (nextCategoryId) => {
  router.push({
    name: route.name,
    params: route.params,
    query: buildQuery({
      page: 0, // 카테고리 바뀌면 첫 페이지
      size: size.value,
      categoryId: nextCategoryId,
    }),
  })
}

const onWriteClick = () => {
  router.push({ name: 'Post', params: { boardId: boardId.value } })
}

const onPostClick = (postId) => {
  const q = buildQuery({
    page: page.value,
    size: size.value,
    categoryId: categoryId.value,
  })

  router.push({
    name: 'PostDetail',
    params: { postId },
    query: {
      ...q,
    },
  })
}
</script>
