/** Vue Router 路由配置 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // ===== 公开页面 =====
  {
    path: '/',
    name: 'Home',
    redirect: (to) => {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      let userRole = ''

      if (userStr) {
        try { userRole = JSON.parse(userStr).role } catch { /* ignore */ }
      }

      // 已登录：根据角色跳转
      if (token) {
        return userRole === 'patient' ? '/patient/home' : '/staff/dashboard'
      }

      // 未登录：默认跳转到医护登录页（可根据需求改为患者登录或自定义选择页）
      return '/login'
    },
    meta: { public: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginPage.vue'),
    meta: { title: '医护登录', public: true },
  },
  {
    path: '/patient-login',
    name: 'PatientLogin',
    component: () => import('@/views/login/PatientLoginPage.vue'),
    meta: { title: '患者登录', public: true },
  },
  {
    path: '/patient-register',
    name: 'PatientRegister',
    component: () => import('@/views/login/PatientRegisterPage.vue'),
    meta: { title: '患者注册', public: true },
  },
  {
    path: '/patient-login/face',
    name: 'PatientFaceLogin',
    component: () => import('@/views/patient/FaceLoginPage.vue'),
    meta: { title: '人脸识别登录', public: true },
  },

  // ===== 患者门户（公开访问 + 部分功能需登录）=====
  {
    path: '/patient',
    name: 'PatientPortal',
    component: () => import('@/views/patient/MainPage.vue'),
    meta: { title: '患者门户', public: true },  // ✅ 允许未登录访问
    redirect: '/patient/home',
    children: [
      {
        path: 'home',
        name: 'PatientHome',
        component: () => import('@/views/patient/HomePage.vue'),
        meta: { title: '首页', public: true },  // ✅ 公开
      },
      {
        path: 'report',
        name: 'PatientReport',
        component: () => import('@/views/patient/ReportListPage.vue'),
        meta: { title: '诊断报告', requiresAuth: true },  // 🔒 需要登录
      },
      {
        path: 'report/print',
        name: 'PatientReportPrint',
        component: () => import('@/views/patient/ReportPrintPage.vue'),
        meta: { title: '打印报告', requiresAuth: true },  // 🔒 需要登录
      },
      {
        path: 'history',
        name: 'PatientHistory',
        component: () => import('@/views/patient/HistoryPage.vue'),
        meta: { title: '就诊历史', requiresAuth: true },  // 🔒 需要登录
      },
      {
        path: 'triage',
        name: 'PatientTriage',
        component: () => import('@/views/patient/TriagePage.vue'),
        meta: { title: '智能分诊', public: true },  // ✅ 公开
      },
      {
        path: 'chat',
        name: 'PatientChat',
        component: () => import('@/views/patient/ChatPage.vue'),
        meta: { title: 'AI咨询', public: true },  // ✅ 公开
      },
    ],
  },

  // ===== 医护人员系统（MainLayout）=====
  {
    path: '/staff',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/staff/dashboard',
    meta: { requiresAuth: true }, // 需要登录才能访问
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardPage.vue'),
        meta: { title: '数据看板', icon: 'DataBoard' },
      },
      {
        path: 'diagnose',
        name: 'Diagnose',
        component: () => import('@/views/diagnose/DiagnosePage.vue'),
        meta: { title: '诊断中心', icon: 'FirstAidKit' },
      },
      {
        path: 'triage',
        name: 'Triage',
        component: () => import('@/views/triage/TriagePage.vue'),
        meta: { title: '智能分诊', icon: 'Triage' },
      },
      {
        path: 'chat',
        name: 'Chat',
        component: () => import('@/views/chat/ChatPage.vue'),
        meta: { title: 'AI咨询', icon: 'ChatDotRound' },
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('@/views/history/HistoryPage.vue'),
        meta: { title: '诊断历史', icon: 'Clock' },
      },
      {
        path: 'approval',
        name: 'Approval',
        component: () => import('@/views/approval/ApprovalPage.vue'),
        meta: { title: '诊断审批', icon: 'Stamp' },
      },
      {
        path: 'revise',
        name: 'Revise',
        component: () => import('@/views/revise/RevisePage.vue'),
        meta: { title: '诊断修正', icon: 'Edit' },
      },
      {
        path: 'batch',
        name: 'BatchDiagnose',
        component: () => import('@/views/batch/BatchPage.vue'),
        meta: { title: '批量诊断', icon: 'Files' },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/ProfilePage.vue'),
        meta: { title: '个人信息', icon: 'User' },
      },
    ],
  },

  // ===== 管理后台（AdminLayout）=====
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/admin/overview',
    meta: { role: 'admin' },
    children: [
      {
        path: 'overview',
        name: 'AdminOverview',
        component: () => import('@/views/admin/OverviewPage.vue'),
        meta: { title: '系统概览', icon: 'Monitor', role: 'admin' },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UsersPage.vue'),
        meta: { title: '用户管理', icon: 'User', role: 'admin' },
      },
      {
        path: 'patients',
        name: 'AdminPatients',
        component: () => import('@/views/admin/PatientsPage.vue'),
        meta: { title: '患者管理', icon: 'UserFilled', role: 'admin' },
      },
      {
        path: 'models',
        name: 'AdminModels',
        component: () => import('@/views/admin/ModelsPage.vue'),
        meta: { title: '权重文件管理', icon: 'Cpu', role: 'admin' },
      },
      {
        path: 'llm',
        name: 'AdminLlm',
        component: () => import('@/views/admin/LlmPage.vue'),
        meta: { title: '大模型API管理', icon: 'Connection', role: 'admin' },
      },
      {
        path: 'audit',
        name: 'AdminAudit',
        component: () => import('@/views/admin/AuditPage.vue'),
        meta: { title: '审计日志', icon: 'Document', role: 'admin' },
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/SettingsPage.vue'),
        meta: { title: '系统设置', icon: 'Setting', role: 'admin' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫 - 完全隔离医护和患者
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const userStr = localStorage.getItem('user')
  let userRole = ''

  if (userStr) {
    try { userRole = JSON.parse(userStr).role } catch { /* ignore */ }
  }

  // 设置页面标题
  document.title = `${to.meta.title || '胸影智诊V3.0'} - 胸影智诊`

  // ========== 公开页面 ==========
  if (to.meta.public) {
    if (token) {
      // 已登录用户访问登录页时，才重定向到对应首页
      const isLoginPage = to.path === '/login' || to.path === '/patient-login' || to.path === '/patient-login/face' || to.path === '/patient-register'
      if (isLoginPage) {
        if (userRole === 'patient') {
          next('/patient/home')
        } else {
          next('/staff/dashboard')
        }
        return
      }
    }
    // 其他公开页面（如 /patient/home, /patient/triage 等），直接放行
    next()
    return
  }

  // ========== 未登录 ==========
  if (!token) {
    // ✅ 如果访问的是公开页面，允许访问
    if (to.meta.public) {
      next()
      return
    }

    // 🔒 需要登录的页面，跳转到患者登录页
    // 注意：这里我们允许用户进入 /patient/report 和 /patient/history 页面
    // 由页面组件内部处理登录检查并显示友好提示
    if (to.path.startsWith('/patient')) {
      // 对于报告和历史页面，允许进入，由组件内部处理
      if (to.path === '/patient/report' || to.path === '/patient/history') {
        next()  // 允许进入，组件会显示登录提示
      } else {
        next('/patient-login')
      }
    } else {
      // 否则跳转到医护登录页
      next('/login')
    }
    return
  }

  // ========== 患者权限隔离 ==========
  if (userRole === 'patient') {
    // 患者只能访问 /patient 页面
    if (to.meta.role === 'patient') {
      next()
    } else {
      // 患者试图访问医护页面 → 强制跳回患者门户
      next('/patient/home')
    }
    return
  }

  // ========== 医护人员权限 ==========
  // 患者专属页面，医护人员无法访问
  if (to.meta.role === 'patient') {
    next('/staff/dashboard')
    return
  }

  // 管理员页面权限检查
  if (to.meta.role === 'admin' && userRole !== 'admin') {
    next('/staff/dashboard')
    return
  }

  next()
})

export default router
