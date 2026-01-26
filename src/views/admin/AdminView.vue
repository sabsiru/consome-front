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

<style scoped>
.admin-view {
  font-family: 'Outfit', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  padding: 32px;
}

.page-header {
  margin-bottom: 48px;
}

.page-header h1 {
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin: 0;
}

.page-header .accent {
  color: var(--accent);
}

.subtitle {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
  margin: 4px 0 0;
}

.nav-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  max-width: 900px;
}

.nav-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 28px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-card:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent);
  transform: translateY(-2px);
}

.nav-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-card.disabled:hover {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  transform: none;
}

.nav-icon {
  font-size: 24px;
  color: var(--accent);
  display: block;
  margin-bottom: 16px;
}

.nav-card h3 {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px;
}

.nav-card p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}
</style>
