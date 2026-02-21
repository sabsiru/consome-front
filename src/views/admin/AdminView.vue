<template>
  <div class="admin-view">
    <header class="page-header">
      <h1>Admin<span class="accent">.</span>Dashboard</h1>
      <p class="subtitle">Management Console</p>
    </header>

    <div class="nav-grid">
      <div class="nav-card" @click="goToSectionManage">
        <span class="nav-icon">▣</span>
        <h3>섹션 관리</h3>
        <p>섹션 CRUD 및 순서 관리</p>
      </div>

      <div class="nav-card" @click="goToBoardManage">
        <span class="nav-icon">◆</span>
        <h3>게시판 관리</h3>
        <p>Board, Category 관리</p>
      </div>

      <div class="nav-card" @click="goToMainBoardManage">
        <span class="nav-icon">★</span>
        <h3>메인 게시판</h3>
        <p>메인 게시판 순서 관리</p>
      </div>

      <div class="nav-card" @click="goToUserManage">
        <span class="nav-icon">◇</span>
        <h3>회원 관리</h3>
        <p>사용자 조회 및 관리</p>
      </div>

      <div class="nav-card" @click="goHome">
        <span class="nav-icon">←</span>
        <h3>메인 페이지</h3>
        <p>홈으로 돌아가기</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import '@/assets/styles/admin/admin.css'
import '@/assets/styles/admin/admin-dashboard.css'

const router = useRouter()

const goToSectionManage = () => {
  router.push('/admin/sections')
}
const goToBoardManage = () => {
  router.push('/admin/boards')
}
const goToUserManage = () => {
  router.push('/admin/users')
}
const goToMainBoardManage = () => {
  router.push('/admin/main-boards')
}
const goHome = () => {
  router.push('/')
}
</script>

