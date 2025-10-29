import AdminView from '@/views/admin/AdminView.vue'
import BoardManageView from '@/views/admin/BoardManageView.vue'

export default [
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { role: 'ADMIN' },
  },
  {
    path: '/admin/boards',
    name: 'boardManage',
    component: BoardManageView,
    meta: { role: 'ADMIN' },
  },
]
