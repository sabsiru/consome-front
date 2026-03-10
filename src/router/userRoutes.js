import UserProfileView from '@/views/user/UserProfileView.vue'
import EmailVerifyView from '@/views/EmailVerifyView.vue'
import PasswordResetRequestView from '@/views/PasswordResetRequestView.vue'
import PasswordResetView from '@/views/PasswordResetView.vue'

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
  {
    path: '/password/reset-request',
    name: 'PasswordResetRequest',
    component: PasswordResetRequestView,
  },
  {
    path: '/password/reset',
    name: 'PasswordReset',
    component: PasswordResetView,
  },
]
