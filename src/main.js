import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import '@/assets/styles/index.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

app.mount('#app')

// 스크롤 시에만 스크롤바 표시
let scrollTimer = null
window.addEventListener('scroll', () => {
  document.documentElement.classList.add('is-scrolling')
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    document.documentElement.classList.remove('is-scrolling')
  }, 1000)
}, { passive: true })
