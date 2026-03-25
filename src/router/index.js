import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import PopularPostsView from '../views/PopularPostsView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import BoardsView from '../views/BoardsView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import FavoriteBoardsView from '../views/board/FavoriteBoardsView.vue'
import AdminRoutes from '@/router/adminRoutes.js'
import BoardRoutes from '@/router/boardRoutes.js'
import UserRoutes from '@/router/userRoutes.js'
import MessageRoutes from '@/router/messageRoutes.js'
import NotificationRoutes from '@/router/notificationRoutes.js'
import BoardManageView from '@/views/admin/BoardManageView.vue'
import FindIdView from '@/views/FindIdView.vue'
import PasswordResetRequestView from '@/views/PasswordResetRequestView.vue'
import PasswordResetView from '@/views/PasswordResetView.vue'
import { adminGuard, redirectIfLoggedIn } from '@/router/guards/authGuards.js'
import { useUserStore } from '@/stores/userStore.js'
import { toast } from 'vue-sonner'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/popular', name: 'popular', component: PopularPostsView },
    { path: '/boards', name: 'boards', component: BoardsView },
    { path: '/favorites', name: 'favorites', component: FavoriteBoardsView, meta: { requiresAuth: true } },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/find-id', name: 'find-id', component: FindIdView },
    { path: '/password/reset-request', name: 'password-reset-request', component: PasswordResetRequestView },
    { path: '/password/reset', name: 'password-reset', component: PasswordResetView },
    { path: '/manager/boards', name: 'manager-boards', component: BoardManageView },
    ...BoardRoutes,
    ...UserRoutes,
    ...MessageRoutes,
    ...NotificationRoutes,
    ...AdminRoutes,
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

router.beforeEach(async (to, from, next) => {
  if (to.path.startsWith('/admin')) {
    await adminGuard(to, next)
  }

  if (to.path.startsWith('/manager')) {
    const store = useUserStore()
    if (!store.token) {
      toast.info('로그인이 필요합니다.')
      return next('/login')
    }
    if (store.role !== 'MANAGER' && store.role !== 'ADMIN') {
      toast.error('매니저 권한이 필요합니다.')
      return next('/')
    }
  }

  if (to.path === '/login') {
    redirectIfLoggedIn(to, next)
  }

  if (to.meta.requiresAuth) {
    const store = useUserStore()
    if (!store.token) {
      toast.info('로그인이 필요합니다.')
      return next('/login')
    }
  }

  next()
})

export default router
