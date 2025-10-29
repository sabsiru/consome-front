<template>
  <div class="admin-view">
    <h1>관리자 페이지</h1>
    <p>여기서 게시판, 섹션, 카테고리를 관리할 수 있습니다.</p>

    <button @click="goToBoardManage" class="admin-btn">게시판 관리</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToBoardManage = () => {
  router.push('/admin/boards')
}
</script>

<style scoped>
.admin-view {
  padding: 40px;
  text-align: center;
}

.admin-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.admin-btn:hover {
  background-color: #357ABD;
}
</style>
