<template>
  <div class="admin-view">
    <header class="page-header">
      <h1>Admin<span class="accent">.</span>Dashboard</h1>
      <p class="subtitle">Management Console</p>
    </header>

    <!-- 통계 카드 섹션 -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-icon">📊</span>
        <div class="stat-content">
          <p class="stat-label">누적 방문자</p>
          <p class="stat-value">{{ stats.totalVisitors.toLocaleString() }}</p>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">📅</span>
        <div class="stat-content">
          <p class="stat-label">오늘 방문자</p>
          <p class="stat-value">{{ stats.todayVisitors.toLocaleString() }}</p>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon">👤</span>
        <div class="stat-content">
          <p class="stat-label">현재 접속자</p>
          <p class="stat-value accent">{{ stats.onlineCount }}</p>
        </div>
      </div>
    </div>

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
        <h3>주요 게시판</h3>
        <p>주요 게시판 관리</p>
      </div>

      <div class="nav-card" @click="goToUserManage">
        <span class="nav-icon">◇</span>
        <h3>회원 관리</h3>
        <p>사용자 조회 및 관리</p>
      </div>

      <div class="nav-card" @click="goToReportManage">
        <span class="nav-icon">⚠</span>
        <h3>신고 관리</h3>
        <p>신고 접수 및 처리</p>
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
import { ref, onMounted } from 'vue'
import { getAdminStatistics } from '@/api/statisticsApi.js'
import '@/assets/styles/admin/admin.css'
import '@/assets/styles/admin/admin-dashboard.css'

const router = useRouter()

const stats = ref({
  totalVisitors: 0,
  todayVisitors: 0,
  onlineCount: 0
})

const fetchStats = async () => {
  try {
    const { data } = await getAdminStatistics()
    stats.value = data
  } catch (e) {
    console.error('[Admin] 통계 조회 실패', e)
  }
}

onMounted(() => {
  fetchStats()
})

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
const goToReportManage = () => {
  router.push('/admin/reports')
}
const goHome = () => {
  router.push('/')
}
</script>

