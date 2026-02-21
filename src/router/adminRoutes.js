import AdminView from '@/views/admin/AdminView.vue'
import BoardManageView from '@/views/admin/BoardManageView.vue'
import UserManageView from '@/views/admin/UserManageView.vue'
import MainBoardManageView from '@/views/admin/MainBoardManageView.vue'
import SectionManageView from '@/views/admin/SectionManageView.vue'

export default [
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { role: 'ADMIN' },
  },
  {
    path: '/admin/sections',
    name: 'sectionManage',
    component: SectionManageView,
    meta: { role: 'ADMIN' },
  },
  {
    path: '/admin/boards',
    name: 'boardManage',
    component: BoardManageView,
    meta: { role: 'ADMIN' },
  },
  {
    path: '/admin/main-boards',
    name: 'mainBoardManage',
    component: MainBoardManageView,
    meta: { role: 'ADMIN' },
  },
  {
    path: '/admin/users/',
    name: 'userManage',
    component: UserManageView,
    meta: { role: 'ADMIN' },
  }
]
