/** 认证状态管理 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, patientLoginApi, staffLoginApi, staffFaceLoginApi, getCurrentUserApi } from '@/api/auth'

function applyTheme(theme: string) {
  const html = document.documentElement

  // 同时设置类名和属性，确保两种选择器都生效
  html.classList.remove('light', 'dark')
  html.classList.add(theme)
  html.setAttribute('data-theme', theme)
}

function detectSystemTheme(): string {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<any>(null)
  const theme = ref(localStorage.getItem('theme') || detectSystemTheme())

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')
  const isAdmin = computed(() => userRole.value === 'admin')
  const isDoctor = computed(() => userRole.value === 'doctor')
  const isNurse = computed(() => userRole.value === 'nurse')
  const isPatient = computed(() => userRole.value === 'patient')

  async function login(username: string, password: string) {
    const res: any = await loginApi({ username, password })
    token.value = res.data.token
    user.value = res.data.user
    theme.value = res.data.theme || 'dark'

    // ⚠️ 关键修复：使用 Promise 确保 localStorage 写入完成
    await new Promise<void>((resolve) => {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      localStorage.setItem('theme', theme.value)
      applyTheme(theme.value)

      // 等待下一个事件循环，确保写入完成
      setTimeout(() => resolve(), 50)
    })
  }

  async function patientLogin(patientNo: string, loginMethod = 'patient_no') {
    const res: any = await patientLoginApi({ patient_no: patientNo, login_method: loginMethod })
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
  }

  async function staffLogin(username: string, loginMethod = 'password') {
    // 医护人员使用普通登录接口，但标记为刷脸登录
    const res: any = await staffLoginApi({ username, password: '', login_method: loginMethod })
    token.value = res.data.token
    user.value = res.data.user
    theme.value = res.data.theme || 'dark'
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    localStorage.setItem('theme', theme.value)
    applyTheme(theme.value)
  }

  async function staffFaceLogin(userData: {
    user_id: number
    username: string
    real_name?: string
    role?: string
    department?: string
  }) {
    // 医护人员刷脸登录（无需密码）
    const res: any = await staffFaceLoginApi(userData)
    token.value = res.data.token
    user.value = res.data.user
    theme.value = res.data.theme || 'light'
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    localStorage.setItem('theme', theme.value)
    applyTheme(theme.value)
  }

  async function fetchUser() {
    try {
      const res: any = await getCurrentUserApi()
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function setTheme(newTheme: string) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // 初始化
  function init() {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try { user.value = JSON.parse(savedUser) } catch { /* ignore */ }
    }
    // 从 localStorage 读取最新主题并应用
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      theme.value = savedTheme
    }
    applyTheme(theme.value)
  }

  init()

  return { token, user, theme, isLoggedIn, userRole, isAdmin, isDoctor, isNurse, isPatient, login, patientLogin, staffLogin, staffFaceLogin, fetchUser, logout, setTheme }
})
