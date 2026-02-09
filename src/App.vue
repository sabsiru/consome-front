<script setup>
import { RouterView } from 'vue-router'
import AppHeader from './components/common/AppHeader.vue'
import './assets/styles/layout.css'
</script>

<template>
  <header>
    <AppHeader />
  </header>

  <div class="app-shell">
    <main class="app-content">
      <RouterView />
    </main>
  </div>

  <footer class="app-footer">
    <div class="app-footer__inner">
      <span>© 2026 Consome</span>
    </div>
  </footer>
</template>

<style scoped>

</style>
