<template>
  <div class="board-manage">
    <h1>게시판 관리</h1>
    <button @click="loadBoards">게시판 목록 불러오기</button>

    <BoardListTable
      v-if="boards.length"
      :boards="boards"
      @delete="deleteBoard"
    />

    <p v-else>등록된 게시판이 없습니다.</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import BoardListTable from '@/components/admin/BoardListTable.vue'
import { getBoards, deleteBoardById } from '@/api/adminBoardApi.js'

const boards = ref([])

async function loadBoards() {
  const res = await getBoards()
  boards.value = res.data
}

async function deleteBoard(id) {
  await deleteBoardById(id)
  await loadBoards()
}

onMounted(() => {
  loadBoards()
})
</script>

<style scoped>
.board-manage {
  padding: 2rem;
}
</style>
