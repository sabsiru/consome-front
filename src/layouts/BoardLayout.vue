<template>
  <div class="layout">
    <div class="layout__container">
      <BoardHeader
        :board-name="boardName"
        :description="description"
        :admin-name="adminName"
        :board-id="boardId"
      />

      <p v-if="isLoading" class="text-muted" style="margin: 12px 0;">로딩 중…</p>
      <p v-else-if="loadError" class="text-muted" style="margin: 12px 0;">{{ loadError }}</p>

      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/api/axios.js'
import BoardHeader from '@/components/board/BoardHeader.vue'
import '@/assets/styles/layout.css'

const route = useRoute()
const boardId = computed(() => Number(route.params.boardId))

const boardName = ref('')
const description = ref('')
const adminName = ref('')
const isLoading = ref(false)
const loadError = ref('')

const loadBoardHeader = async () => {
  if (!boardId.value) return

  isLoading.value = true
  loadError.value = ''

  try {
    const res = await api.get(`/boards/${boardId.value}/posts`, { params: { headerOnly: true } })
    const data = res.data

    boardName.value = data.boardName ?? data.name ?? '게시판 이름'
    description.value = data.description ?? '게시판 설명'
    const managers = data.managers ?? []
    adminName.value = managers.length > 0
      ? managers.map(m => m.nickname).join(', ')
      : '관리자 없음'
  } catch (e) {
    loadError.value = '게시판 정보를 불러오지 못했습니다.'
    boardName.value = ''
    description.value = ''
    adminName.value = ''
  } finally {
    isLoading.value = false
  }
}

watchEffect(() => {
  void loadBoardHeader()
})
</script>
