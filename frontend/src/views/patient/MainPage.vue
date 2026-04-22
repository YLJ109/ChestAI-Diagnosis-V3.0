/** 患者门户 - 主框架页面（带导航栏的布局） */
<template>
    <div class="patient-portal">
        <!-- ===== 顶部导航栏（仅首页显示）===== -->
        <header v-if="isRoute('/patient/home')" class="portal-header">
            <div class="header-content">
                <!-- Logo和标题 -->
                <div class="header-left" @click="router.push('/patient/home')">
                    <div class="logo-icon">
                        <el-icon :size="28">
                            <FirstAidKit />
                        </el-icon>
                    </div>
                    <div class="header-title">
                        <h1>胸影智诊</h1>
                        <span class="subtitle">患者自助服务终端 V3.0</span>
                    </div>
                </div>

                <!-- 右侧用户信息和统计 -->
                <div class="header-right">
                    <!-- 返回首页按钮（仅分诊和咨询页面显示） -->
                    <el-button v-if="isRoute('/patient/triage') || isRoute('/patient/chat')" text size="small"
                        class="back-home-btn" @click="router.push('/patient/home')">
                        <el-icon>
                            <ArrowLeft />
                        </el-icon>
                        返回首页
                    </el-button>

                    <!-- 统计信息 -->
                    <div class="header-stats">
                        <div class="stat-item">
                            <el-icon>
                                <Calendar />
                            </el-icon>
                            <span>{{ formatDate(new Date()) }}</span>
                        </div>
                        <div class="stat-item">
                            <el-icon>
                                <Cpu />
                            </el-icon>
                            <span>AI引擎就绪</span>
                        </div>
                    </div>

                    <!-- 用户信息 -->
                    <div class="user-info">
                        <el-avatar :size="36" class="user-avatar">
                            {{ (userInfo.name || 'U').charAt(0).toUpperCase() }}
                        </el-avatar>
                        <div class="user-details">
                            <span class="user-name">{{ userInfo.name || '患者' }}</span>
                            <span class="user-id">{{ userInfo.patient_id || 'ID: --' }}</span>
                        </div>
                    </div>

                    <!-- 主题切换和退出 -->
                    <div class="header-actions">
                        <el-button text circle class="theme-toggle" @click="toggleTheme"
                            :title="isDarkTheme ? '切换到浅色模式' : '切换到深色模式'">
                            <el-icon :size="18">
                                <Sunny v-if="isDarkTheme" />
                                <Moon v-else />
                            </el-icon>
                            <span class="theme-label">{{ isDarkTheme ? '深色' : '浅色' }}</span>
                        </el-button>
                        <el-button text class="logout-btn" @click="handleLogout">
                            <el-icon>
                                <SwitchButton />
                            </el-icon>退出
                        </el-button>
                    </div>
                </div>
            </div>
        </header>

        <!-- ===== 主内容区 ===== -->
        <main class="portal-main">
            <!-- 路由视图 - 显示子页面 -->
            <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in">
                    <component :is="Component" />
                </transition>
            </router-view>
        </main>

        <!-- ===== 底部状态栏（仅首页显示）===== -->
        <footer v-if="isRoute('/patient/home')" class="portal-footer">
            <span>胸影智诊 V3.0 | 患者自助服务终端 | Powered by CheXNet + LLM</span>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, type ComputedRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
    FirstAidKit, ArrowLeft, Calendar, Cpu,
    SwitchButton, Sunny, Moon
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
// 引入患者门户专属主题样式
import '@/styles/patient-theme.css'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 当前路由路径
const currentRoute: ComputedRef<string> = computed(() => route.path)

// 检查是否为特定路由
const isRoute = (path: string): boolean => {
    return route.path === path
}

// 用户信息
const userInfo = computed(() => authStore.user || {})

// 主题管理
const isDarkTheme = ref(false)

// 格式化日期
function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[date.getDay()]
    return `${year}-${month}-${day} ${weekDay}`
}

// 切换主题
const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value
    const newTheme = isDarkTheme.value ? 'dark' : 'light'

    // 直接设置data-theme属性（与 auth.ts 保持一致）
    document.documentElement.setAttribute('data-theme', newTheme)

    // 保存到localStorage（统一使用 'theme' key）
    localStorage.setItem('theme', newTheme)

    console.log('✅ 主题切换为:', newTheme)
}

// 退出登录
const handleLogout = () => {
    authStore.logout()
    ElMessage.success('已安全退出')
    router.push('/patient-login')
}

// 初始化主题
onMounted(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark') {
        isDarkTheme.value = true
        document.documentElement.setAttribute('data-theme', 'dark')
    } else {
        isDarkTheme.value = false
        document.documentElement.setAttribute('data-theme', 'light')
    }
})
</script>

<style scoped>
/* ===== 整体布局 ===== */
.patient-portal {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--patient-bg-primary);
    color: var(--patient-text-primary);
    overflow: hidden;
}

/* ===== 顶部导航栏 - 高品质玻璃态设计 ===== */
.portal-header {
    background: var(--patient-glass-bg);
    backdrop-filter: var(--patient-glass-blur);
    border-bottom: 1px solid var(--patient-glass-border);
    box-shadow: 0 4px 24px rgba(var(--patient-primary-rgb), 0.08);
    z-index: 100;
    flex-shrink: 0;
}

.header-content {
    max-width: 1600px;
    margin: 0 auto;
    padding: 16px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

/* 左侧Logo */
.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.header-left:hover {
    opacity: 0.92;
}

.logo-icon {
    width: 48px;
    height: 48px;
    background: var(--patient-gradient-medical);
    border-radius: var(--patient-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(var(--patient-primary-rgb), 0.3);
    transition: all 0.3s ease;
}

.header-left:hover .logo-icon {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(var(--patient-primary-rgb), 0.4);
}

.header-title h1 {
    font-size: 20px;
    font-weight: 700;
    color: var(--patient-text-primary);
    margin: 0;
    letter-spacing: 0.5px;
    background: var(--patient-gradient-medical);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.subtitle {
    font-size: 11px;
    color: var(--patient-text-secondary);
    font-weight: 500;
    margin-top: 2px;
    display: block;
    letter-spacing: 0.3px;
}

/* 右侧区域 */
.header-right {
    display: flex;
    align-items: center;
    gap: 24px;
}

/* 返回首页按钮 */
.back-home-btn {
    padding: 8px 18px !important;
    font-size: 13px !important;
    color: var(--patient-text-secondary) !important;
    border: 1px solid var(--patient-card-border) !important;
    border-radius: var(--patient-radius-md) !important;
    transition: all 0.3s ease !important;
    background: var(--patient-bg-secondary) !important;
}

.back-home-btn:hover {
    color: var(--patient-primary) !important;
    border-color: var(--patient-primary) !important;
    background: var(--patient-primary-light) !important;
    box-shadow: 0 2px 8px rgba(var(--patient-primary-rgb), 0.15) !important;
}

/* 统计信息 */
.header-stats {
    display: flex;
    gap: 18px;
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--patient-text-secondary);
    background: var(--patient-bg-tertiary);
    padding: 6px 14px;
    border-radius: var(--patient-radius-full);
    border: 1px solid var(--patient-card-border);
    transition: all 0.3s ease;
}

.stat-item:hover {
    background: var(--patient-primary-light);
    border-color: var(--patient-primary);
    color: var(--patient-primary);
}

.stat-item .el-icon {
    font-size: 14px;
}

/* 用户信息 */
.user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--patient-bg-tertiary);
    padding: 6px 16px 6px 6px;
    border-radius: var(--patient-radius-full);
    border: 1px solid var(--patient-card-border);
    transition: all 0.3s ease;


}

.user-info:hover {
    background: var(--patient-primary-light);
    border-color: var(--patient-primary);

}

.user-avatar {
    background: var(--patient-gradient-medical);
    color: #fff;
    font-weight: 700;
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 2px 8px rgba(var(--patient-primary-rgb), 0.25);
}

.user-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.user-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--patient-text-primary);
}

.user-id {
    font-size: 11px;
    color: var(--patient-text-muted);
}

/* 操作按钮 */
.header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.theme-toggle {
    color: var(--patient-text-secondary) !important;
    position: relative;
    background: var(--patient-bg-tertiary) !important;
    border: 1px solid var(--patient-card-border) !important;
    transition: all 0.3s ease !important;
}

.theme-toggle:hover {
    color: var(--patient-primary) !important;
    background: var(--patient-primary-light) !important;
    border-color: var(--patient-primary) !important;
    box-shadow: 0 2px 8px rgba(var(--patient-primary-rgb), 0.15) !important;
}

.theme-label {
    position: absolute;
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 10px;
    background: var(--patient-text-primary);
    color: var(--patient-bg-secondary);
    padding: 2px 8px;
    border-radius: var(--patient-radius-sm);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.theme-toggle:hover .theme-label {
    opacity: 1;
}

.logout-btn {
    color: var(--patient-text-secondary) !important;
    font-size: 13px !important;
    padding: 8px 18px !important;
    background: var(--patient-bg-tertiary) !important;
    border: 1px solid var(--patient-card-border) !important;
    border-radius: var(--patient-radius-md) !important;
    transition: all 0.3s ease !important;
}

.logout-btn:hover {
    color: #fff !important;
    background: var(--patient-primary) !important;
    border-color: var(--patient-primary) !important;
    box-shadow: 0 2px 8px rgba(var(--patient-primary-rgb), 0.25) !important;
}

/* ===== 主内容区 ===== */
.portal-main {
    flex: 1;
    position: relative;
}

/* 非首页模块 - 允许自然滚动 */
.portal-main:not(:has(.home-view)) {
    overflow-y: auto !important;
    overflow-x: hidden !important;
}

/* ===== 底部状态栏 - 简洁商务风 ===== */
.portal-footer {
    background: var(--patient-glass-bg);
    backdrop-filter: var(--patient-glass-blur);
    border-top: 1px solid var(--patient-glass-border);
    padding: 10px 32px;
    text-align: center;
    font-size: 11px;
    color: var(--patient-text-muted);
    flex-shrink: 0;
    letter-spacing: 0.3px;
}

/* ===== 过渡动画 ===== */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
