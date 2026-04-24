/** 患者门户 - 首页（医院自助终端风格 - 彩色按钮布局） */
<template>
    <div class="home-view">


        <!-- 功能模块区域 -->
        <div class="modules-container">
            <!-- 第一行：2个大按钮（已实现的核心功能） -->
            <div class="row-large">
                <!-- 智能分诊 -->
                <div class="module-btn btn-large btn-pink" @click="router.push('/patient/triage')">
                    <el-icon :size="40">
                        <FirstAidKit />
                    </el-icon>
                    <div class="btn-content">
                        <h3 class="btn-title">智能分诊</h3>
                        <p class="btn-subtitle">症状分析推荐科室</p>
                    </div>
                </div>

                <!-- AI健康咨询 -->
                <div class="module-btn btn-large btn-purple" @click="router.push('/patient/chat')">
                    <el-icon :size="40">
                        <ChatDotRound />
                    </el-icon>
                    <div class="btn-content">
                        <h3 class="btn-title">AI健康咨询</h3>
                        <p class="btn-subtitle">24小时智能问答</p>
                    </div>
                </div>
            </div>

            <!-- 第二行：2个中等按钮（需登录功能） -->
            <div class="row-medium">
                <!-- 报告历史 -->
                <div class="module-btn btn-medium btn-orange" @click="handleAuthRequired('/patient/history')">
                    <el-icon :size="36">
                        <Document />
                    </el-icon>
                    <div class="btn-content">
                        <h3 class="btn-title">患者历史</h3>
                        <p class="btn-subtitle">查看诊断记录</p>
                    </div>
                    <span v-if="stats.total_diagnoses > 0" class="badge">{{ stats.total_diagnoses }}</span>
                    <!-- 未登录提示图标 -->
                    <el-icon v-if="!isLoggedIn" class="lock-icon" :size="20">
                        <Lock />
                    </el-icon>
                </div>

                <!-- 打印报告 -->
                <div class="module-btn btn-medium btn-green" @click="handleAuthRequired('/patient/report')">
                    <el-icon :size="36">
                        <Printer />
                    </el-icon>
                    <div class="btn-content">
                        <h3 class="btn-title">打印报告</h3>
                        <p class="btn-subtitle">获取纸质报告</p>
                    </div>
                    <span v-if="stats.reviewed_reports > 0" class="badge">{{ stats.reviewed_reports }}</span>
                    <!-- 未登录提示图标 -->
                    <el-icon v-if="!isLoggedIn" class="lock-icon" :size="20">
                        <Lock />
                    </el-icon>
                </div>
            </div>

            <!-- 第三行：4个小按钮（预留功能） -->
            <div class="row-small">
                <div class="module-btn btn-small btn-blue" @click="showComingSoon('预约就诊')">
                    <el-icon :size="28">
                        <Calendar />
                    </el-icon>
                    <div class="btn-content">
                        <h4 class="btn-title">预约就诊</h4>
                        <p class="btn-subtitle">在线预约挂号</p>
                    </div>
                </div>

                <div class="module-btn btn-small btn-blue" @click="showComingSoon('费用查询')">
                    <el-icon :size="28">
                        <Money />
                    </el-icon>
                    <div class="btn-content">
                        <h4 class="btn-title">费用查询</h4>
                        <p class="btn-subtitle">查询就诊费用</p>
                    </div>
                </div>

                <div class="module-btn btn-small btn-blue" @click="showComingSoon('用药指导')">
                    <el-icon :size="28">
                        <TakeawayBox />
                    </el-icon>
                    <div class="btn-content">
                        <h4 class="btn-title">用药指导</h4>
                        <p class="btn-subtitle">药品使用说明</p>
                    </div>
                </div>

                <div class="module-btn btn-small btn-blue" @click="showComingSoon('医院导航')">
                    <el-icon :size="28">
                        <Location />
                    </el-icon>
                    <div class="btn-content">
                        <h4 class="btn-title">医院导航</h4>
                        <p class="btn-subtitle">院内科室导航</p>
                    </div>
                </div>
            </div>

            <!-- 第四行：4个小按钮（预留功能） -->
            <div class="row-small">
                <div class="module-btn btn-small btn-blue" @click="showComingSoon('检查预约')">
                    <el-icon :size="28">
                        <Picture />
                    </el-icon>
                    <div class="btn-content">
                        <h4 class="btn-title">检查预约</h4>
                        <p class="btn-subtitle">预约检查项目</p>
                    </div>
                </div>

                <div class="module-btn btn-small btn-blue" @click="showComingSoon('健康档案')">
                    <el-icon :size="28">
                        <Files />
                    </el-icon>
                    <div class="btn-content">
                        <h4 class="btn-title">健康档案</h4>
                        <p class="btn-subtitle">个人健康信息</p>
                    </div>
                </div>

                <div class="module-btn btn-small btn-blue" @click="showComingSoon('就医指南')">
                    <el-icon :size="28">
                        <Reading />
                    </el-icon>
                    <div class="btn-content">
                        <h4 class="btn-title">就医指南</h4>
                        <p class="btn-subtitle">就诊流程指导</p>
                    </div>
                </div>

                <div class="module-btn btn-small btn-red" @click="handleLogout">
                    <el-icon :size="28">
                        <SwitchButton />
                    </el-icon>
                    <div class="btn-content">
                        <h4 class="btn-title">退出登录</h4>
                        <p class="btn-subtitle">安全退出系统</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
    Document, FirstAidKit, ChatDotRound, Printer, Lock,
    Calendar, Money, TakeawayBox, Location,
    Picture, Files, Reading, SwitchButton
} from '@element-plus/icons-vue'
import { getPatientDashboardApi } from '@/api/patient-portal'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 是否已登录
const isLoggedIn = computed(() => !!authStore.token)

// 统计数据
const stats = ref({
    total_diagnoses: 0,
    reviewed_reports: 0,
    triage_count: 0,
})

// 显示功能即将上线提示
const showComingSoon = (feature: string) => {
    ElMessage.info(`${feature}功能即将上线，敬请期待！`)
}

// 处理需要登录的功能
const handleAuthRequired = (path: string) => {
    // 直接跳转，由目标页面显示登录提示
    router.push(path)
}

// 退出登录
const handleLogout = () => {
    authStore.logout()
    ElMessage.success('已安全退出')
    router.push('/patient-login')
}

// 加载首页数据
onMounted(async () => {
    // 只有已登录用户才加载统计数据
    if (!isLoggedIn.value) {
        return  // 未登录时不加载，避免 401 错误
    }

    try {
        const res = await getPatientDashboardApi()
        if (res.data) {
            stats.value = res.data.stats || res.data
        }
    } catch (e: any) {
        // 静默处理错误，不显示控制台报错
        if (e.response?.status !== 401) {
            console.error('加载首页数据失败', e)
        }
    }
})
</script>

<style scoped>
/* ===== 首页视图 - 医院自助终端风格 ===== */
.home-view {
    max-width: 90%;
    margin: 0 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 20px 20px;
}

/* ===== 顶部欢迎横幅 ===== */
.welcome-banner {
    background: linear-gradient(135deg, #3B82F6, #2563EB);
    border-radius: 12px;
    padding: 16px 24px;
    text-align: center;
    margin-bottom: 24px;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.banner-text {
    font-size: 24px;
    font-weight: 700;
    color: #fff;
    margin: 0;
    letter-spacing: 2px;
}

/* ===== 功能模块容器 ===== */
.modules-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 0;
}

/* 行布局 */
.row-large,
.row-medium,
.row-small {
    display: grid;
    gap: 20px;
    flex-shrink: 0;
}

.row-large {
    grid-template-columns: repeat(2, 1fr);
}

.row-medium {
    grid-template-columns: repeat(2, 1fr);
}

.row-small {
    grid-template-columns: repeat(4, 1fr);
}

/* ===== 功能按钮基础样式 ===== */
.module-btn {
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    color: #fff;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    overflow: hidden;
}

/* 光泽效果 */
.module-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
}

.module-btn:hover::before {
    left: 100%;
}

.module-btn:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.4);
}

.module-btn:active {
    transform: translateY(-2px) scale(0.98);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 按钮内容 */
.btn-content {
    flex: 1;
}

.btn-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
    letter-spacing: 0.5px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-subtitle {
    font-size: 13px;
    margin: 0;
    opacity: 0.95;
    font-weight: 400;
    line-height: 1.4;
}

/* 徽章 */
.badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #fff;
    color: #000;
    font-size: 13px;
    font-weight: 700;
    min-width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    border: 2px solid currentColor;
    animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

/* 锁图标 - 未登录提示 */
.lock-icon {
    position: absolute;
    top: 12px;
    left: 12px;
    color: rgba(255, 255, 255, 0.9);
    animation: lockPulse 2s ease-in-out infinite;
}

@keyframes lockPulse {

    0%,
    100% {
        opacity: 0.6;
        transform: scale(1);
    }

    50% {
        opacity: 1;
        transform: scale(1.1);
    }
}

/* ===== 大按钮 ===== */
.btn-large {
    padding: 32px 40px;
    min-height: 240px;
}

.btn-large .el-icon {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 16px;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(5px);
}

.btn-large .btn-title {
    font-size: 24px;
    font-weight: 600;
}

.btn-large .btn-subtitle {
    font-size: 14px;
    opacity: 0.9;
}

/* 粉色 - 智能分诊 */
.btn-pink {
    background: linear-gradient(135deg, #EC4899, #DB2777);
}

/* 紫色 - AI咨询 */
.btn-purple {
    background: linear-gradient(135deg, #8B5CF6, #7C3AED);
}

/* ===== 中等按钮 ===== */
.btn-medium {
    padding: 32px 40px;
    min-height: 230px;
}

.btn-medium .el-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 14px;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(5px);
}

.btn-medium .btn-title {
    font-size: 22px;
    font-weight: 600;
}

.btn-medium .btn-subtitle {
    font-size: 14px;
    opacity: 0.9;
}

/* 橙色 - 报告历史 */
.btn-orange {
    background: linear-gradient(135deg, #F59E0B, #D97706);
}

/* 绿色 - 打印报告 */
.btn-green {
    background: linear-gradient(135deg, #10B981, #059669);
}

/* ===== 小按钮 ===== */
.btn-small {
    padding: 18px 14px;
    min-height: 76px;
    flex-direction: column;
    text-align: center;
    gap: 8px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.1);
}

.btn-small .el-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.25);
    border-radius: 10px;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-small .btn-content {
    width: 100%;
}

.btn-small .btn-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 4px;
}

.btn-small .btn-subtitle {
    font-size: 11px;
    opacity: 0.85;
}

/* 蓝色 - 预留功能 */
.btn-blue {
    background: linear-gradient(135deg, #3B82F6, #2563EB);
}

/* 红色 - 退出登录 */
.btn-red {
    background: linear-gradient(135deg, #EF4444, #DC2626);
}

/* ===== 响应式适配 ===== */
@media (max-width: 1024px) {
    .row-small {
        grid-template-columns: repeat(2, 1fr);
    }

    .btn-large {
        padding: 24px 20px;
        min-height: 100px;
    }

    .btn-medium {
        padding: 24px 20px;
        min-height: 90px;
    }
}

@media (max-width: 768px) {
    .home-view {
        max-width: 95%;
    }

    .welcome-banner {
        padding: 12px 16px;
    }

    .banner-text {
        font-size: 20px;
    }

    .row-large,
    .row-medium {
        grid-template-columns: 1fr;
    }

    .row-small {
        grid-template-columns: repeat(2, 1fr);
    }

    .module-btn {
        padding: 16px;
    }
}
</style>
