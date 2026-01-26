<template>
  <div class="admin-view">
    <header class="page-header">
      <h1>Admin<span class="accent">.</span>Dashboard</h1>
      <p class="subtitle">Management Console</p>
    </header>

    <div class="nav-grid">
      <div class="nav-card" @click="goToBoardManage">
        <span class="nav-icon">◆</span>
        <h3>게시판 관리</h3>
        <p>Section, Board, Category 관리</p>
      </div>

      <div class="nav-card" @click="goToUserManage">
        <span class="nav-icon">◇</span>
        <h3>회원 관리</h3>
        <p>사용자 조회 및 관리</p>
      </div>

      <div class="nav-card disabled">
        <span class="nav-icon">○</span>
        <h3>매니저 관리</h3>
        <p>준비 중</p>
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

const goToBoardManage = () => {
  router.push('/admin/boards')
}
const goToUserManage = () => {
  router.push('/admin/users')
}
const goHome = () => {
  router.push('/')
}
</script>

