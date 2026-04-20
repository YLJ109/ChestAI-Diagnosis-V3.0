/** 患者门户 - 独立布局（与医护系统完全隔离） */
<template>
  <div class="patient-portal">
    <!-- 顶部导航栏 -->
    <header class="portal-header">
      <div class="header-inner">
        <div class="header-brand">
          <el-icon :size="22" color="#22d3ee"><Avatar /></el-icon>
          <span class="brand-name">患者门户</span>
        </div>
        <div class="header-user">
          <span class="user-greeting">{{ greeting }}，{{ userName }}</span>
          <el-button text size="small" type="danger" @click="handleLogout">
            <el-icon><SwitchButton /></el-icon>
            退出
          </el-button>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="portal-main">
      <div class="welcome-banner glass-card">
        <div class="banner-icon">
          <el-icon :size="48" color="#22d3ee"><Avatar /></el-icon>
        </div>
        <div class="banner-text">
          <h2>欢迎回来，{{ userName }}</h2>
          <p>这里是您的个人健康中心，可查看诊断报告和健康信息</p>
        </div>
      </div>

      <!-- 功能卡片网格 -->
      <div class="feature-grid">
        <div class="feature-card glass-card" v-for="item in features" :key="item.key">
          <div class="card-icon" :style="{ background: item.bg }">
            <el-icon :size="28" :color="item.color"><component :is="item.icon" /></el-icon>
          </div>
          <h3 class="card-title">{{ item.title }}</h3>
          <p class="card-desc">{{ item.desc }}</p>
          <el-tag :type="item.ready ? 'success' : 'info'" size="small" effect="plain">
            {{ item.ready ? '可用' : '开发中' }}
          </el-tag>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="portal-notice glass-card">
        <el-icon :size="18" color="#f59e0b"><InfoFilled /></el-icon>
        <span>患者门户功能正在持续完善中，如有疑问请联系医护人员</span>
      </div>
    </main>

    <!-- 底部 -->
    <footer class="portal-footer">
      <span>胸影智诊 V3.0 | 患者自助服务终端</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  Avatar, SwitchButton, InfoFilled,
  Document, Clock, ChatDotRound, Bell, FirstAidKit
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const userName = computed(() => authStore.user?.name || authStore.user?.real_name || '患者')

// 根据时间段返回问候语
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 功能列表（仅展示，暂未实现）
const features = [
  {
    key: 'report',
    icon: Document,
    title: '诊断报告',
    desc: '查看AI辅助诊断报告及医生审核意见',
    bg: 'rgba(34, 211, 238, 0.1)',
    color: '#22d3ee',
    ready: false,
  },
  {
    key: 'history',
    icon: Clock,
    title: '就诊记录',
    desc: '历史诊断记录与影像资料',
    bg: 'rgba(99, 102, 241, 0.1)',
    color: '#6366f1',
    ready: false,
  },
  {
    key: 'chat',
    icon: ChatDotRound,
    title: 'AI健康咨询',
    desc: '智能问答，了解检查结果含义',
    bg: 'rgba(34, 197, 94, 0.1)',
    color: '#22c55e',
    ready: false,
  },
  {
    key: 'notify',
    icon: Bell,
    title: '消息通知',
    desc: '检查预约提醒与报告完成通知',
    bg: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
    ready: false,
  },
  {
    key: 'diagnose',
    icon: FirstAidKit,
    title: '在线问诊',
    desc: '在线提交症状描述获取初步分析',
    bg: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    ready: false,
  },
]

function handleLogout() {
  authStore.logout()
  router.push('/patient-login')
}
</script>

<style scoped>
.patient-portal {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

/* ===== 顶部栏 ===== */
.portal-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.88);
  border-bottom: 1px solid var(--glass-border);
  backdrop-filter: blur(12px);
}

.header-inner {
  max-width: 1000px;
  margin: 0 auto;
  padding: 12px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-name {
  font-size: 17px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-greeting {
  font-size: 14px;
  color: var(--text-secondary);
}

/* ===== 主内容 ===== */
.portal-main {
  flex: 1;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  padding: 32px 28px;
}

/* 欢迎横幅 */
.welcome-banner {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 32px !important;
  margin-bottom: 28px;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.06), rgba(99, 102, 241, 0.04));
}

.banner-icon {
  flex-shrink: 0;
}

.banner-text h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.banner-text p {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 功能卡片 */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 28px;
}

.feature-card {
  padding: 24px !important;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: default;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-desc {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  flex: 1;
}

/* 提示 */
.portal-notice {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px !important;
  font-size: 13px;
  color: var(--text-secondary);
}

/* ===== 底部 ===== */
.portal-footer {
  text-align: center;
  padding: 14px 28px;
  font-size: 11px;
  color: var(--text-muted);
  border-top: 1px solid var(--glass-border);
  letter-spacing: 0.5px;
}
</style>
