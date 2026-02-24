<template>
  <div class="main-board-manage">
    <header class="page-header">
      <h1>Featured<span class="accent">.</span>Boards</h1>
      <p class="subtitle">주요 게시판 관리</p>
    </header>

    <div class="content-panel">
      <div class="panel-header">
        <span class="panel-tag">ORDER</span>
        <h2>드래그하여 순서 변경</h2>
      </div>

      <draggable
        v-model="mainBoards"
        item-key="boardId"
        handle=".drag-handle"
        ghost-class="sortable-ghost"
        @end="onDragEnd"
        class="main-board-list"
      >
        <template #item="{ element: board, index }">
          <div class="main-board-item">
            <span class="drag-handle">⋮⋮</span>
            <span class="order-number">{{ index + 1 }}</span>
            <span class="board-name">{{ board.boardName }}</span>
            <div class="board-toggles">
              <button
                class="toggle-btn"
                :class="{ active: board.writeEnabled }"
                @click="toggleWrite(board)"
                title="글쓰기 허용"
              >
                ✎
              </button>
              <button
                class="toggle-btn"
                :class="{ active: board.commentEnabled }"
                @click="toggleComment(board)"
                title="댓글 허용"
              >
                💬
              </button>
            </div>
            <button class="btn-sm btn-danger" @click="removeFromMain(board)">제거</button>
          </div>
        </template>
      </draggable>

      <div v-if="!mainBoards.length" class="empty-list">
        <span class="empty-icon">∅</span>
        <p>주요 게시판이 없습니다</p>
        <p class="empty-hint">게시판 관리에서 주요 게시판을 설정하세요</p>
      </div>

      <div class="panel-actions">
        <button class="btn btn-ghost" @click="$router.back()">뒤로가기</button>
        <button class="btn btn-primary" @click="saveOrder" :disabled="!hasChanges">
          순서 저장
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import draggable from 'vuedraggable'
import api from '@/api/axios'
import { eventBus } from '@/utils/eventBus.js'
import '@/assets/styles/admin/admin.css'
import '@/assets/styles/admin/main-board-manage.css'

const mainBoards = ref([])
const originalOrder = ref([])

const hasChanges = computed(() => {
  if (mainBoards.value.length !== originalOrder.value.length) return true
  return mainBoards.value.some((board, idx) => board.boardId !== originalOrder.value[idx])
})

onMounted(async () => {
  await loadMainBoards()
})

const loadMainBoards = async () => {
  try {
    const res = await api.get('/navigation/main-boards')
    mainBoards.value = res.data
    originalOrder.value = res.data.map(b => b.boardId)
  } catch (err) {
    console.error(err)
  }
}

const onDragEnd = () => {
  // 드래그 종료 시 자동 저장하지 않고 버튼으로 저장
}

const saveOrder = async () => {
  const orders = mainBoards.value.map((board, idx) => ({
    boardId: board.boardId,
    displayOrder: idx + 1
  }))
  try {
    await api.put('/admin/boards/main/reorder', { orders })
    originalOrder.value = mainBoards.value.map(b => b.boardId)
    eventBus.emit('main-boards-updated')
    alert('순서가 저장되었습니다.')
  } catch (err) {
    console.error(err)
    alert('순서 저장 실패')
  }
}

const removeFromMain = async (board) => {
  if (!confirm(`'${board.boardName}'을(를) 주요 게시판에서 제거하시겠습니까?`)) return
  try {
    await api.patch(`/admin/boards/${board.boardId}/main`)
    await loadMainBoards()
    eventBus.emit('main-boards-updated')
  } catch (err) {
    console.error(err)
    alert('제거 실패')
  }
}

const toggleWrite = async (board) => {
  try {
    const res = await api.patch(`/admin/boards/${board.boardId}/write-enabled`)
    board.writeEnabled = res.data.writeEnabled
  } catch (err) {
    console.error(err)
    alert('글쓰기 설정 변경 실패')
  }
}

const toggleComment = async (board) => {
  try {
    const res = await api.patch(`/admin/boards/${board.boardId}/comment-enabled`)
    board.commentEnabled = res.data.commentEnabled
  } catch (err) {
    console.error(err)
    alert('댓글 설정 변경 실패')
  }
}
</script>
