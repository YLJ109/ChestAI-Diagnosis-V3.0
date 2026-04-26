/**
* 移动端个人中心 - 个人信息 + 设置
*/
<template>
    <div class="mobile-profile">
        <!-- 加载中状态 -->
        <div v-if="loading" class="loading-container">
            <el-icon class="is-loading" :size="48" color="#0EA5E9">
                <Loading />
            </el-icon>
            <p class="loading-text">加载中...</p>
        </div>

        <!-- 未登录提示 -->
        <div v-else-if="!isLoggedIn" class="empty-state">
            <el-icon :size="64" color="#9CA3AF">
                <Lock />
            </el-icon>
            <p class="empty-text">请先登录后查看个人信息</p>
            <el-button type="primary" @click="goToLogin">立即登录</el-button>
        </div>

        <!-- 正常内容 -->
        <template v-else>
            <!-- 用户信息卡片 -->
            <div class="profile-card glass-card">
                <div class="profile-header">
                    <div class="avatar-large">
                        <el-icon :size="48">
                            <User />
                        </el-icon>
                    </div>
                    <div class="user-info">
                        <h2 class="user-name">{{ userInfo.name }}</h2>
                        <p class="user-no">患者编号: {{ userInfo.patientNo }}</p>
                        <el-tag size="small" type="success">已认证</el-tag>
                    </div>
                </div>

                <div class="profile-stats">
                    <div class="stat-item">
                        <div class="stat-value">{{ stats.diagnosisCount }}</div>
                        <div class="stat-label">诊断次数</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <div class="stat-value">{{ stats.reportCount }}</div>
                        <div class="stat-label">报告数量</div>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="stat-item">
                        <div class="stat-value">{{ stats.visitCount }}</div>
                        <div class="stat-label">就诊记录</div>
                    </div>
                </div>
            </div>

            <!-- 功能列表 -->
            <div class="menu-section">
                <div class="menu-group">
                    <h3 class="group-title">个人信息</h3>
                    <div class="menu-list">
                        <div class="menu-item" @click="handleMenuClick('face')">
                            <div class="menu-icon" style="background: linear-gradient(135deg, #0EA5E9, #06B6D4);">
                                <el-icon>
                                    <Tickets />
                                </el-icon>
                            </div>
                            <span class="menu-label">人脸信息管理</span>
                            <el-icon class="arrow">
                                <ArrowRight />
                            </el-icon>
                        </div>

                        <div class="menu-item" @click="handleMenuClick('edit')">
                            <div class="menu-icon" style="background: linear-gradient(135deg, #10B981, #059669);">
                                <el-icon>
                                    <Edit />
                                </el-icon>
                            </div>
                            <span class="menu-label">编辑个人资料</span>
                            <el-icon class="arrow">
                                <ArrowRight />
                            </el-icon>
                        </div>
                    </div>
                </div>

                <div class="menu-group">
                    <h3 class="group-title">设置</h3>
                    <div class="menu-list">
                        <div class="menu-item" @click="handleMenuClick('notification')">
                            <div class="menu-icon" style="background: linear-gradient(135deg, #F59E0B, #D97706);">
                                <el-icon>
                                    <Bell />
                                </el-icon>
                            </div>
                            <span class="menu-label">消息通知</span>
                            <el-switch v-model="settings.notification" size="small" />
                        </div>

                        <div class="menu-item" @click="handleMenuClick('privacy')">
                            <div class="menu-icon" style="background: linear-gradient(135deg, #EC4899, #DB2777);">
                                <el-icon>
                                    <Lock />
                                </el-icon>
                            </div>
                            <span class="menu-label">隐私设置</span>
                            <el-icon class="arrow">
                                <ArrowRight />
                            </el-icon>
                        </div>
                    </div>
                </div>

                <div class="menu-group">
                    <h3 class="group-title">其他</h3>
                    <div class="menu-list">
                        <div class="menu-item" @click="handleMenuClick('about')">
                            <div class="menu-icon" style="background: linear-gradient(135deg, #8B5CF6, #7C3AED);">
                                <el-icon>
                                    <InfoFilled />
                                </el-icon>
                            </div>
                            <span class="menu-label">关于我们</span>
                            <el-icon class="arrow">
                                <ArrowRight />
                            </el-icon>
                        </div>

                        <div class="menu-item" @click="handleMenuClick('switch-desktop')">
                            <div class="menu-icon" style="background: linear-gradient(135deg, #6366F1, #4F46E5);">
                                <el-icon>
                                    <Monitor />
                                </el-icon>
                            </div>
                            <span class="menu-label">切换到桌面版</span>
                            <el-icon class="arrow">
                                <ArrowRight />
                            </el-icon>
                        </div>

                        <div class="menu-item" @click="handleLogout">
                            <div class="menu-icon" style="background: linear-gradient(135deg, #EF4444, #DC2626);">
                                <el-icon>
                                    <SwitchButton />
                                </el-icon>
                            </div>
                            <span class="menu-label" style="color: #EF4444;">退出登录</span>
                            <el-icon class="arrow">
                                <ArrowRight />
                            </el-icon>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 版本信息 -->
            <div class="version-info">
                <p>胸影智诊 V3.0</p>
                <p>Version 3.0.0 (Build 20260421)</p>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
    User, Tickets, Edit, Bell, Moon, Lock,
    InfoFilled, SwitchButton, ArrowRight, Monitor, Loading
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getPatientDashboardApi } from '@/api/patient-portal'
import { toggleMobileMode } from '@/utils/device'

const router = useRouter()

// 登录状态
const isLoggedIn = ref(false)
const loading = ref(false)

// 用户信息
const userInfo = ref({
    name: '',
    patientNo: '',
})

// 统计数据
const stats = ref({
    diagnosisCount: 12,
    reportCount: 8,
    visitCount: 15,
})

// 设置
const settings = ref({
    notification: true,
})

// 跳转到登录页
function goToLogin() {
    router.push('/patient-login/mobile')
}

// 从localStorage预加载用户信息
function loadUserInfoFromStorage() {
    try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
            const user = JSON.parse(userStr)
            console.log('个人中心 - 加载用户信息:', user)

            userInfo.value = {
                name: user.name || user.real_name || '未知',
                patientNo: user.patient_no || user.patientNo || '',
            }

            isLoggedIn.value = !!localStorage.getItem('token')
        }
    } catch (error) {
        console.error('从localStorage加载用户信息失败:', error)
    }
}

// 加载数据
onMounted(async () => {
    console.log('MobileProfilePage mounted')

    // 先从localStorage预加载(快速显示)
    loadUserInfoFromStorage()

    // 然后从API获取最新数据
    loading.value = true
    try {
        const res: any = await getPatientDashboardApi()
        if (res.data) {
            userInfo.value.name = res.data.patient_name || userInfo.value.name
            userInfo.value.patientNo = res.data.patient_no || userInfo.value.patientNo
            stats.value.diagnosisCount = res.data.diagnosis_count || 0
            stats.value.reportCount = res.data.report_count || 0
            stats.value.visitCount = res.data.visit_count || 0

            console.log('个人中心 - API数据加载成功:', res.data)
        }
    } catch (error: any) {
        console.error('加载用户信息失败:', error)

        // 如果是401错误,跳转到移动端访客页
        if (error.response?.status === 401) {
            ElMessage.error('登录已过期,请重新登录')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            isLoggedIn.value = false
            router.push('/patient/mobile-guest')
        }
    } finally {
        loading.value = false
    }
})

// 菜单点击
function handleMenuClick(type: string) {
    switch (type) {
        case 'face':
            router.push('/patient-login/face')
            break
        case 'edit':
            ElMessage.info('编辑功能开发中')
            break
        case 'notification':
            ElMessage.info('通知设置开发中')
            break
        case 'privacy':
            ElMessage.info('隐私设置开发中')
            break
        case 'about':
            ElMessageBox.alert(
                '胸影智诊V3.0 - AI智能辅助胸部X光影像诊断系统\n\n基于Vue 3 + Flask + DenseNet-121 + ONNX Runtime + LLM的医学影像平台',
                '关于',
                { confirmButtonText: '确定' }
            )
            break
        case 'switch-desktop':
            ElMessageBox.confirm(
                '确定要切换到桌面版吗?',
                '提示',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'info',
                }
            ).then(() => {
                toggleMobileMode(false)
            }).catch(() => {
                // 用户取消
            })
            break
    }
}

// 退出登录
async function handleLogout() {
    try {
        await ElMessageBox.confirm('确定要退出登录吗?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        })

        // 清除本地存储
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        ElMessage.success('已退出登录')
        router.push('/patient-login')
    } catch {
        // 用户取消
    }
}
</script>

<style scoped lang="scss">
.mobile-profile {
    padding: 16px;
    min-height: 100%;
    height: 100%; // 确保填满父容器
    background: #f5f7fa;
}

/* ===== 加载状态 ===== */
.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 16px;
}

.loading-text {
    font-size: 14px;
    color: #6B7280;
    margin: 0;
}

/* ===== 空状态 ===== */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 16px;
    padding: 40px 20px;
    text-align: center;
}

.empty-text {
    font-size: 16px;
    color: #6B7280;
    margin: 0;
}

/* ===== 用户信息卡片 ===== */
.profile-card {
    background: linear-gradient(135deg, #0EA5E9, #06B6D4);
    border-radius: 20px;
    padding: 24px 20px;
    margin-bottom: 16px;
    box-shadow: 0 4px 16px rgba(14, 165, 233, 0.3);
}

.profile-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
}

.avatar-large {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.user-info {
    flex: 1;
}

.user-name {
    font-size: 22px;
    font-weight: 700;
    color: white;
    margin: 0 0 6px 0;
}

.user-no {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 8px 0;
}

.profile-stats {
    display: flex;
    align-items: center;
    justify-content: space-around;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 16px;
}

.stat-item {
    text-align: center;
    flex: 1;
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
    color: white;
    line-height: 1;
}

.stat-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.9);
    margin-top: 6px;
}

.stat-divider {
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.3);
}

/* ===== 功能列表 ===== */
.menu-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.menu-group {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.group-title {
    font-size: 14px;
    font-weight: 600;
    color: #6B7280;
    padding: 12px 16px 8px;
    margin: 0;
}

.menu-list {
    display: flex;
    flex-direction: column;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #F3F4F6;

    &:last-child {
        border-bottom: none;
    }

    &:active {
        background: #F9FAFB;
    }
}

.menu-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
}

.menu-label {
    flex: 1;
    font-size: 15px;
    color: #1F2937;
    font-weight: 500;
}

.arrow {
    color: #9CA3AF;
    font-size: 16px;
}

/* ===== 版本信息 ===== */
.version-info {
    text-align: center;
    padding: 24px 0 16px;

    p {
        font-size: 12px;
        color: #9CA3AF;
        margin: 4px 0;
    }
}

/* ===== 玻璃态效果 ===== */
.glass-card {
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}
</style>
