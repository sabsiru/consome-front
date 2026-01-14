<template>
  <div class="layout">
    <div class="layout__container">
      <!-- 게시판 헤더(항상 상단에 유지) -->
      <BoardHeader
        :board-name="boardName"
        :description="description"
        :admin-name="adminName"
      />

      <!-- 필요 시 최소 상태 표기 (원치 않으면 제거 가능) -->
      <p v-if="isLoading" class="text-muted" style="margin: 12px 0;">로딩 중…</p>
      <p v-else-if="loadError" class="text-muted" style="margin: 12px 0;">{{ loadError }}</p>

      <!-- 게시판 하위 화면(목록/상세/작성/수정)이 이 영역에서 교체됨 -->
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

// NOTE: 이 레이아웃은 "게시판(boardId) 하위" 라우트에서만 사용되는 전용 레이아웃입니다.
// 역할: 게시판 헤더를 고정(언마운트 방지)하고, 하위 화면은 <router-view>로 교체합니다.

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
    // 기대 응답 예시:
    // { boardId: 1, boardName: '자유게시판', description: '...', adminName: '관리자' }
    const res = await api.get(`/boards/${boardId.value}/posts`)
    const data = res.data

    boardName.value = data.boardName ?? data.name ?? '게시판 이름'
    description.value = data.description ?? '게시판 설명'
    adminName.value = data.adminName ?? data.admin ?? '관리자없음'
  } catch (e) {
    // 레이아웃은 페이지 흐름을 막지 않기 위해 최소한의 실패 처리만 합니다.
    loadError.value = '게시판 정보를 불러오지 못했습니다.'
    boardName.value = ''
    description.value = ''
    adminName.value = ''
  } finally {
    isLoading.value = false
  }
}

watchEffect(() => {
  // boardId가 바뀌는 경우(다른 게시판으로 이동)만 재로딩
  void loadBoardHeader()
})
</script>
