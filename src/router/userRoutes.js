import UserProfileView from '@/views/user/UserProfileView.vue'
import EmailVerifyView from '@/views/EmailVerifyView.vue'

export default [
  {
    path: '/users/:userId',
    name: 'UserProfile',
    component: UserProfileView,
    props: (route) => ({ userId: Number(route.params.userId) }),
  },
  {
    path: '/email/verify',
    name: 'EmailVerify',
    component: EmailVerifyView,
  },
]
