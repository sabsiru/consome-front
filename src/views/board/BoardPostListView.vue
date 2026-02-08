<template>
  <BoardPostList
    :board-id="boardId"
    :page="page"
    :size="size"
    :category-id="categoryId"
    :keyword="keyword"
    :search-type="searchType"
    @loaded="onLoaded"
    @page-change="onPageChange"
    @category-change="onCategoryChange"
    @post-click="onPostClick"
    @write-click="onWriteClick"
    @search="onSearch"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BoardPostList from '@/components/board/BoardPostList.vue'
import { useUserStore } from '@/stores/userStore.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const boardId = computed(() => Number(route.params.boardId))
const page = computed(() => Number(route.query.page ?? 0))
const size = computed(() => Number(route.query.size ?? 20))
const categoryId = computed(() => {
  const v = route.query.categoryId
  return v === undefined || v === null || v === '' ? null : Number(v)
})
const keyword = computed(() => route.query.keyword ?? '')
const searchType = computed(() => route.query.type ?? 'TITLE_CONTENT')

const boardName = ref('')

const DEFAULT_PAGE = 0
const DEFAULT_SIZE = 20

const buildQuery = ({ page, size, categoryId, keyword: kw, type }) => {
  const q = { ...route.query }

  delete q.page
  delete q.size
  delete q.categoryId
  delete q.keyword
  delete q.type

  // 기본값이 아니면만 query에 포함
  if (page !== DEFAULT_PAGE) q.page = String(page)
  if (size !== DEFAULT_SIZE) q.size = String(size)
  if (categoryId != null) q.categoryId = String(categoryId)
  if (kw) q.keyword = kw
  if (kw && type && type !== 'TITLE_CONTENT') q.type = type

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
      keyword: keyword.value,
      type: searchType.value,
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
      keyword: keyword.value,
      type: searchType.value,
    }),
  })
}

const onWriteClick = () => {
  if (!userStore.token) {
    if (confirm('로그인이 필요합니다. 로그인 하시겠습니까?')) {
      router.push({ name: 'login', query: { redirect: route.fullPath } })
    }
    return
  }
  router.push({ name: 'PostWrite', params: { boardId: boardId.value } })
}

const onSearch = ({ keyword: kw, type }) => {
  router.push({
    name: route.name,
    params: route.params,
    query: buildQuery({
      page: 0, // 검색하면 첫 페이지
      size: size.value,
      categoryId: categoryId.value,
      keyword: kw,
      type,
    }),
  })
}

const onPostClick = (postId) => {
  const q = buildQuery({
    page: page.value,
    size: size.value,
    categoryId: categoryId.value,
    keyword: keyword.value,
    type: searchType.value,
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
