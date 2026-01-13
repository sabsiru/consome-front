import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { useUserStore } from '@/stores/userStore'
import api from '@/api/axios'
import './assets/base.css'


const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
app.use(pinia)
app.use(router)

const store = useUserStore()

const token = localStorage.getItem('accessToken')
if (token && !store.nickname) {
  try {
    const { data } = await api.get('/users/me')
    store.setUserData(data)
  } catch (e) {
    console.error('자동 로그인 실패:', e)
    if (e.response && e.response.status === 401) {
      store.clearUser()
    }
  }
}

app.mount('#app')
