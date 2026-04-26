/**
* 患者移动端主页面
* 使用Tab导航: 首页 / 报告 / 分诊 / AI咨询 / 我的
*/
<template>
    <MobileLayout ref="layoutRef" @tab-change="onTabChange">
        <!-- 首页 -->
        <template #home>
            <!-- 未登录时显示引导 -->
            <div v-if="!isLoggedIn" class="login-guide">
                <div class="guide-icon">
                    <el-icon :size="64">
                        <User />
                    </el-icon>
                </div>
                <h3 class="guide-title">登录后查看诊断报告</h3>
                <p class="guide-desc">登录后可以查看您的AI诊断报告、就诊历史等信息</p>
                <el-button type="primary" size="large" class="guide-btn" @click="goToLogin">
                    立即登录
                </el-button>
                <el-button size="large" class="guide-btn-secondary" @click="goToRegister">
                    新用户注册
                </el-button>
            </div>
            <!-- 登录后显示首页内容 -->
            <MobileHomePage v-else />
        </template>

        <!-- 报告列表 -->
        <template #reports>
            <div v-if="!isLoggedIn" class="login-guide">
                <div class="guide-icon">
                    <el-icon :size="64">
                        <Document />
                    </el-icon>
                </div>
                <h3 class="guide-title">登录后查看诊断报告</h3>
                <p class="guide-desc">查看您的AI诊断报告和影像资料</p>
                <el-button type="primary" size="large" class="guide-btn" @click="goToLogin">
                    立即登录
                </el-button>
            </div>
            <MobileReportListPage v-else />
        </template>

        <!-- 智能分诊 -->
        <template #triage>
            <MobileTriagePage />
        </template>

        <!-- AI咨询 -->
        <template #chat>
            <MobileChatPage />
        </template>

        <!-- 我的 -->
        <template #profile>
            <MobileProfilePage v-if="isLoggedIn" />
            <!-- 未登录时显示引导 -->
            <div v-else class="login-guide">
                <div class="guide-icon">
                    <el-icon :size="64">
                        <Setting />
                    </el-icon>
                </div>
                <h3 class="guide-title">登录后查看个人信息</h3>
                <p class="guide-desc">管理您的个人资料、设置和偏好</p>
                <el-button type="primary" size="large" class="guide-btn" @click="goToLogin">
                    立即登录
                </el-button>
                <el-button size="large" class="guide-btn-secondary" @click="goToRegister">
                    新用户注册
                </el-button>
            </div>
        </template>
    </MobileLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Document, Setting } from '@element-plus/icons-vue'
import MobileLayout from '@/components/MobileLayout.vue'
import MobileHomePage from './MobileHomePage.vue'
import MobileReportListPage from './MobileReportListPage.vue'
import MobileTriagePage from './MobileTriagePage.vue'
import MobileChatPage from './MobileChatPage.vue'
import MobileProfilePage from './MobileProfilePage.vue'

const router = useRouter()
const layoutRef = ref()
const isLoggedIn = ref(false)  // 登录状态

function onTabChange(index: number) {
    console.log('切换到Tab:', index)
}

function goToLogin() {
    router.push('/patient-login/mobile')
}

function goToRegister() {
    router.push('/patient-register/mobile')
}

// 统一登录检查(在移动端主入口)
onMounted(() => {
    // 强制患者端使用浅色主题
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')
    // 注意：不再清除 localStorage 中的 theme 设置，避免影响其他模块

    const token = localStorage.getItem('token')

    // 不强制跳转,允许未登录访问移动端主页
    // 登录状态由子组件的v-if控制
    isLoggedIn.value = !!token

    // 注册 Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('[SW] Registered:', registration.scope)
                })
                .catch((error) => {
                    console.error('[SW] Registration failed:', error)
                })
        })
    }
})
</script>

<style scoped lang="scss">
.login-guide {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 40px 20px;
    text-align: center;

    .guide-icon {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin-bottom: 24px;
    }

    .guide-title {
        font-size: 20px;
        font-weight: 700;
        color: #1F2937;
        margin: 0 0 12px 0;
    }

    .guide-desc {
        font-size: 14px;
        color: #6B7280;
        margin: 0 0 32px 0;
        line-height: 1.6;
    }

    .guide-btn,
    .guide-btn-secondary {
        width: 100%;
        max-width: 300px;
        height: 48px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 12px;
        margin-bottom: 12px;
    }

    .guide-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
    }

    .guide-btn-secondary {
        background: white;
        color: #667eea;
        border: 2px solid #667eea;
    }
}
</style>
