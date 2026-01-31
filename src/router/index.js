import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import AdminRoutes from '@/router/adminRoutes.js'
import BoardRoutes from '@/router/boardRoutes.js'
import BoardManageView from '@/views/admin/BoardManageView.vue'
import { adminGuard, redirectIfLoggedIn } from '@/router/guards/authGuards.js'
import { useUserStore } from '@/stores/userStore.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/manager/boards', name: 'manager-boards', component: BoardManageView },
    ...BoardRoutes,
    ...AdminRoutes,
  ],
})

router.beforeEach(async (to, from, next) => {
  if (to.path.startsWith('/admin')) {
    await adminGuard(to, next)
  }

  if (to.path.startsWith('/manager')) {
    const store = useUserStore()
    if (!store.token) {
      alert('로그인이 필요합니다.')
      return next('/login')
    }
    if (store.role !== 'MANAGER' && store.role !== 'ADMIN') {
      alert('매니저 권한이 필요합니다.')
      return next('/')
    }
  }

  if (to.path === '/login') {
    redirectIfLoggedIn(to, next)
  }
  next()
})

export default router
