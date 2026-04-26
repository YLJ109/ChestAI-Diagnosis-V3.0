/**
* 移动端访客主页
* 展示功能内容,用户浏览后需要登录才能查看个人信息
*/
<template>
    <div class="mobile-home-page">
        <!-- 顶部Header -->
        <div class="page-header">
            <div class="header-left">
                <svg viewBox="0 0 1024 1024" class="header-logo">
                    <path
                        d="M914.28 950.86H109.72c-20.2 0-36.57 16.37-36.57 36.57S89.52 1024 109.72 1024h804.57c20.2 0 36.57-16.37 36.57-36.57s-16.38-36.57-36.58-36.57zM877.71 0H146.28C65.6 0.24 0.24 65.6 0 146.28v585.14c0.24 80.69 65.6 146.04 146.28 146.28h731.43c80.69-0.24 146.05-65.59 146.29-146.28V146.28C1023.76 65.6 958.4 0.24 877.71 0z"
                        fill="#667eea" />
                </svg>
                <h1 class="header-title">胸影智诊</h1>
            </div>
            <el-button text class="login-btn" @click="goToLogin">
                <el-icon>
                    <User />
                </el-icon>
                登录
            </el-button>
        </div>

        <!-- 欢迎Banner -->
        <div class="welcome-banner">
            <h2 class="welcome-title">AI智能辅助胸部X光诊断</h2>
            <p class="welcome-desc">基于DenseNet-121深度学习模型,提供快速、准确的影像分析</p>
        </div>

        <!-- 核心功能 -->
        <div class="features-section">
            <h3 class="section-title">核心功能</h3>
            <div class="feature-grid">
                <div class="feature-card" v-for="feature in features" :key="feature.title"
                    @click="handleFeatureClick(feature)">
                    <div class="feature-icon" :style="{ background: feature.gradient }">
                        <el-icon :size="32">
                            <component :is="feature.icon" />
                        </el-icon>
                    </div>
                    <h4 class="feature-title">{{ feature.title }}</h4>
                    <p class="feature-desc">{{ feature.desc }}</p>
                    <el-tag v-if="feature.requiresAuth" size="small" type="warning" effect="plain">需登录</el-tag>
                </div>
            </div>
        </div>

        <!-- 系统优势 -->
        <div class="advantages-section">
            <h3 class="section-title">系统优势</h3>
            <div class="advantage-list">
                <div class="advantage-item" v-for="item in advantages" :key="item.title">
                    <div class="advantage-icon">
                        <el-icon :size="24">
                            <component :is="item.icon" />
                        </el-icon>
                    </div>
                    <div class="advantage-content">
                        <h4 class="advantage-title">{{ item.title }}</h4>
                        <p class="advantage-desc">{{ item.desc }}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- 底部CTA -->
        <div class="cta-section">
            <el-button type="primary" size="large" class="cta-btn" @click="goToRegister">
                <el-icon>
                    <CirclePlus />
                </el-icon>
                立即注册体验
            </el-button>
            <p class="cta-hint">已有账号? <el-button text @click="goToLogin">立即登录</el-button></p>
        </div>

        <!-- 底部信息 -->
        <div class="footer">
            <p>© 2026 胸影智诊V3.0</p>
            <el-button text size="small" @click="switchToDesktop">切换到桌面版</el-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
    User, CirclePlus, Document, Clock, Aim, ChatDotRound,
    VideoCamera, DataAnalysis, Lock, Check
} from '@element-plus/icons-vue'
import { toggleMobileMode } from '@/utils/device'

const router = useRouter()

// 功能列表
const features = ref([
    {
        title: '诊断报告',
        desc: '查看AI诊断结果与详细分析',
        icon: markRaw(Document),
        gradient: 'linear-gradient(135deg, #3B82F6, #2563EB)',
        requiresAuth: true,
        route: '/patient/report'
    },
    {
        title: '就诊历史',
        desc: '查询历史就诊记录',
        icon: markRaw(Clock),
        gradient: 'linear-gradient(135deg, #10B981, #059669)',
        requiresAuth: true,
        route: '/patient/history'
    },
    {
        title: '智能分诊',
        desc: 'AI症状评估与科室推荐',
        icon: markRaw(Aim),
        gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
        requiresAuth: false,
        route: '/patient/triage'
    },
    {
        title: 'AI咨询',
        desc: '在线医疗咨询服务',
        icon: markRaw(ChatDotRound),
        gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
        requiresAuth: false,
        route: '/patient/chat'
    },
])

// 系统优势
const advantages = ref([
    {
        title: 'AI精准识别',
        desc: '基于DenseNet-121深度学习模型,准确率达81.49%',
        icon: markRaw(DataAnalysis)
    },
    {
        title: '实时影像分析',
        desc: 'ONNX Runtime加速推理,秒级出结果',
        icon: markRaw(VideoCamera)
    },
    {
        title: '隐私保护',
        desc: '数据加密存储,符合医疗信息安全规范',
        icon: markRaw(Lock)
    },
    {
        title: '权威认证',
        desc: '通过医疗AI系统安全认证',
        icon: markRaw(Check)
    },
])

function handleFeatureClick(feature: any) {
    if (feature.requiresAuth) {
        // 需要登录的功能,提示用户登录
        ElMessage.info('请先登录后再使用该功能')
        setTimeout(() => {
            router.push('/patient-login')
        }, 1000)
    } else {
        // 公开功能,直接跳转
        router.push(feature.route)
    }
}

function goToLogin() {
    router.push('/patient-login')
}

function goToRegister() {
    router.push('/patient-register')
}

function switchToDesktop() {
    toggleMobileMode(false)
}
</script>

<style scoped lang="scss">
.mobile-home-page {
    min-height: 100vh;
    background: #F9FAFB;
    padding-bottom: 20px;
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    position: sticky;
    top: 0;
    z-index: 100;

    .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-logo {
            width: 36px;
            height: 36px;
        }

        .header-title {
            font-size: 20px;
            font-weight: 700;
            color: #1F2937;
            margin: 0;
        }
    }

    .login-btn {
        color: #667eea;
        font-size: 15px;
        font-weight: 600;
    }
}

.welcome-banner {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 32px 20px;
    text-align: center;

    .welcome-title {
        font-size: 24px;
        font-weight: 700;
        color: white;
        margin: 0 0 12px 0;
    }

    .welcome-desc {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
        line-height: 1.6;
    }
}

.features-section {
    padding: 24px 20px;

    .section-title {
        font-size: 18px;
        font-weight: 700;
        color: #1F2937;
        margin: 0 0 16px 0;
    }
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.feature-card {
    background: white;
    border-radius: 16px;
    padding: 20px 16px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;

    &:active {
        transform: scale(0.98);
    }

    .feature-icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 12px;
        color: white;
    }

    .feature-title {
        font-size: 15px;
        font-weight: 600;
        color: #1F2937;
        margin: 0 0 8px 0;
    }

    .feature-desc {
        font-size: 12px;
        color: #6B7280;
        margin: 0 0 12px 0;
        line-height: 1.5;
    }

    .el-tag {
        position: absolute;
        top: 8px;
        right: 8px;
    }
}

.advantages-section {
    padding: 24px 20px;
    background: white;
    margin: 0 0 24px 0;

    .section-title {
        font-size: 18px;
        font-weight: 700;
        color: #1F2937;
        margin: 0 0 16px 0;
    }
}

.advantage-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.advantage-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #F9FAFB;
    border-radius: 12px;

    .advantage-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
    }

    .advantage-content {
        flex: 1;

        .advantage-title {
            font-size: 15px;
            font-weight: 600;
            color: #1F2937;
            margin: 0 0 4px 0;
        }

        .advantage-desc {
            font-size: 13px;
            color: #6B7280;
            margin: 0;
            line-height: 1.5;
        }
    }
}

.cta-section {
    padding: 24px 20px;
    text-align: center;

    .cta-btn {
        width: 100%;
        height: 52px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);

        &:active {
            transform: scale(0.98);
        }
    }

    .cta-hint {
        margin-top: 16px;
        font-size: 14px;
        color: #6B7280;

        .el-button {
            color: #667eea;
            font-weight: 600;
        }
    }
}

.footer {
    text-align: center;
    padding: 20px;

    p {
        font-size: 12px;
        color: #9CA3AF;
        margin: 0 0 8px 0;
    }
}
</style>
