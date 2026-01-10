import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RegisterView from '../views/RegisterView.vue'
import LoginView from '../views/LoginView.vue'
import BoardPostListView from '@/views/BoardPostListView.vue'
import PostView from '../views/PostView.vue'
import PostDetail from '../views/PostDetail.vue'
import AdminRoutes from '@/router/adminRoutes.js'
import { adminGuard, redirectIfLoggedIn } from '@/router/guards/authGuards.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/register', name: 'register', component: RegisterView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/boards/:boardId', name: 'BoardPosts', component: BoardPostListView, props: true },
    { path: '/boards/:boardId/post', name: 'Post', component: PostView, props: true },
    { path: '/posts/:postId', name: 'PostDetail', component: PostDetail, props: true },
    ...AdminRoutes,
  ],
})

router.beforeEach(async (to, from, next) => {
  if (to.path.startsWith('/admin')) {
    await adminGuard(to, next)
  }

  if (to.path === '/login') {
    await redirectIfLoggedIn(to, next)
  }
  next()
})

export default router
