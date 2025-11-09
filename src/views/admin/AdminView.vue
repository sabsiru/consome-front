<template>
  <div class="admin-view">
    <h1>관리자 페이지</h1>
    <p>게시판, 회원관리 등 추가 될 예정</p>

    <button @click="goToBoardManage" class="admin-btn">게시판 관리</button>
    <button @click="goToUserManage" class="admin-btn">회원 관리</button>
    <button @click="goToUserManage" class="admin-btn">매너지 관리</button>
    <button @click="goToUserManage" class="admin-btn">관리1</button>
    <button @click="goToUserManage" class="admin-btn">관리2</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goToBoardManage = () => {
  router.push('/admin/boards')
}
const goToUserManage = () => {
  router.push('/admin/users')
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
