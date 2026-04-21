/** 患者门户 - 首页（四大模块入口） */
<template>
    <div class="home-view">
        <!-- 模块入口 - 医疗级一体机终端风格 -->
        <div class="medical-terminals-grid">
            <!-- 诊断报告模块 -->
            <div class="terminal-card report-terminal" @click="router.push('/patient/report')">
                <div class="terminal-header">
                    <div class="terminal-icon">
                        <el-icon :size="36">
                            <Document />
                        </el-icon>
                    </div>
                    <div class="terminal-badge" v-if="stats.reviewed_reports > 0">{{ stats.reviewed_reports }}</div>
                </div>
                <div class="terminal-content">
                    <h3 class="terminal-title">诊断报告</h3>
                    <p class="terminal-desc">查看并打印AI辅助诊断报告及医生审核意见</p>
                </div>
                <div class="terminal-footer">
                    <span class="terminal-action">查看报告</span>
                    <div class="terminal-indicator">
                        <div class="indicator-dot active"></div>
                        <div class="indicator-dot"></div>
                        <div class="indicator-dot"></div>
                    </div>
                </div>
            </div>

            <!-- 就诊历史模块 -->
            <div class="terminal-card history-terminal" @click="router.push('/patient/history')">
                <div class="terminal-header">
                    <div class="terminal-icon">
                        <el-icon :size="36">
                            <Clock />
                        </el-icon>
                    </div>
                    <div class="terminal-badge" v-if="stats.total_diagnoses > 0">{{ stats.total_diagnoses }}</div>
                </div>
                <div class="terminal-content">
                    <h3 class="terminal-title">就诊历史</h3>
                    <p class="terminal-desc">查看全部检测记录、影像资料与分诊结果</p>
                </div>
                <div class="terminal-footer">
                    <span class="terminal-action">查看记录</span>
                    <div class="terminal-indicator">
                        <div class="indicator-dot"></div>
                        <div class="indicator-dot active"></div>
                        <div class="indicator-dot"></div>
                    </div>
                </div>
            </div>

            <!-- 智能分诊模块 -->
            <div class="terminal-card triage-terminal" @click="router.push('/patient/triage')">
                <div class="terminal-header">
                    <div class="terminal-icon">
                        <el-icon :size="36">
                            <FirstAidKit />
                        </el-icon>
                    </div>
                    <div class="urgent-indicator" v-if="latestDiagnosis?.urgent">紧急</div>
                </div>
                <div class="terminal-content">
                    <h3 class="terminal-title">智能分诊</h3>
                    <p class="terminal-desc">专业症状分析，智能评估就诊科室与优先级</p>
                    <div class="medical-tags">
                        <span class="medical-tag">症状评估</span>
                        <span class="medical-tag">科室推荐</span>
                        <span class="medical-tag">紧急程度</span>
                    </div>
                </div>
                <div class="terminal-footer">
                    <span class="terminal-action">开始分诊</span>
                    <div class="terminal-indicator">
                        <div class="indicator-dot"></div>
                        <div class="indicator-dot"></div>
                        <div class="indicator-dot active"></div>
                    </div>
                </div>
            </div>

            <!-- AI咨询模块 -->
            <div class="terminal-card chat-terminal" @click="router.push('/patient/chat')">
                <div class="terminal-header">
                    <div class="terminal-icon">
                        <el-icon :size="36">
                            <ChatDotRound />
                        </el-icon>
                    </div>
                    <div class="ai-status">在线</div>
                </div>
                <div class="terminal-content">
                    <h3 class="terminal-title">AI健康咨询</h3>
                    <p class="terminal-desc">人工智能医疗助手，专业解答与健康管理建议</p>
                    <div class="medical-tags">
                        <span class="medical-tag">24小时服务</span>
                        <span class="medical-tag">专业解答</span>
                        <span class="medical-tag">健康管理</span>
                    </div>
                </div>
                <div class="terminal-footer">
                    <span class="terminal-action">开始咨询</span>
                    <div class="terminal-indicator">
                        <div class="indicator-dot active"></div>
                        <div class="indicator-dot active"></div>
                        <div class="indicator-dot active"></div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Clock, FirstAidKit, ChatDotRound, InfoFilled } from '@element-plus/icons-vue'
import { getPatientDashboardApi } from '@/api/patient-portal'

const router = useRouter()

// 统计数据
const stats = ref({
    total_diagnoses: 0,
    reviewed_reports: 0,
    triage_count: 0,
})

// 最新诊断
const latestDiagnosis = ref<any>(null)

// 加载首页数据
onMounted(async () => {
    try {
        const res = await getPatientDashboardApi()
        if (res.data) {
            stats.value = res.data.stats || res.data
            latestDiagnosis.value = res.data.latest_diagnosis || null
        }
    } catch (e) {
        console.error('加载首页数据失败', e)
    }
})
</script>

<style scoped>
/* ===== 首页视图 - B端后台商务风格，固定布局 ===== */
.home-view {
    max-width: 1400px;
    margin: 0 auto;
    padding: 28px 48px 36px;
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden !important;
}

/* ===== 模块入口网格 - B端后台九宫格风格 ===== */
.medical-terminals-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 40px;
    flex: 1;
    min-height: 0;
    align-content: center;
}

/* ===== 应用卡片 - B端后台风格，纯白底色+柔和投影 ===== */
.terminal-card {
    background: var(--patient-card-bg);
    border: 1px solid var(--patient-card-border);
    border-radius: var(--patient-radius-xl);
    padding: 60px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: var(--patient-card-shadow);
}

/* 顶部装饰条 */
.terminal-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--patient-gradient-medical);
    opacity: 0;
    transition: opacity 0.3s ease;
}

.terminal-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--patient-card-shadow-hover);
    border-color: var(--patient-primary);
    background: var(--patient-bg-secondary);
}

.terminal-card:hover::before {
    opacity: 1;
}

/* 卡片颜色主题 - 统一使用医疗政务蓝 */
.report-terminal,
.history-terminal,
.triage-terminal,
.chat-terminal {
    --card-accent-start: var(--patient-primary);
    --card-accent-end: var(--patient-accent-cyan);
}

/* 卡片头部 */
.terminal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
}

.terminal-icon {
    width: 64px;
    height: 64px;
    border-radius: var(--patient-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    position: relative;
    background: var(--patient-gradient-medical);
    box-shadow: 0 4px 12px rgba(var(--patient-primary-rgb), 0.3);
    transition: all 0.3s ease;
}

.terminal-card:hover .terminal-icon {
    transform: scale(1.08) rotate(-5deg);
    box-shadow: 0 6px 16px rgba(var(--patient-primary-rgb), 0.4);
}

/* 深色模式下图标背景调整 */
[data-theme="dark"] .terminal-icon {
    background: linear-gradient(135deg, #60A5FA, #22D3EE);
    box-shadow: 0 4px 12px rgba(96, 165, 250, 0.3);
}

.terminal-badge {
    background: var(--patient-gradient-medical);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: var(--patient-radius-full);
    box-shadow: 0 2px 8px rgba(var(--patient-primary-rgb), 0.3);
    transition: all 0.3s ease;
}

.terminal-card:hover .terminal-badge {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(var(--patient-primary-rgb), 0.4);
}

/* 深色模式下徽章调整 */
[data-theme="dark"] .terminal-badge {
    background: linear-gradient(135deg, #60A5FA, #22D3EE);
    box-shadow: 0 2px 8px rgba(96, 165, 250, 0.35);
}

.urgent-indicator {
    background: linear-gradient(135deg, #EF4444, #F97316);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: var(--patient-radius-full);
    animation: pulse 2s infinite;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.ai-status {
    background: linear-gradient(135deg, #10B981, #059669);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: var(--patient-radius-full);
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.7;
    }
}

/* 卡片内容 */
.terminal-content {
    flex: 1;
}

.terminal-title {
    font-size: 19px;
    font-weight: 700;
    color: var(--patient-text-primary);
    margin: 0 0 10px 0;
    letter-spacing: 0.3px;
}

.terminal-desc {
    font-size: 13px;
    color: var(--patient-text-secondary);
    line-height: 1.7;
    margin: 0 0 18px 0;
}

.medical-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.medical-tag {
    font-size: 11px;
    padding: 4px 12px;
    border-radius: var(--patient-radius-full);
    background: var(--patient-bg-tertiary);
    color: var(--patient-text-secondary);
    font-weight: 500;
    border: 1px solid var(--patient-card-border);
}

/* 卡片底部 */
.terminal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 18px;
    border-top: 1px solid var(--patient-card-border);
}

.terminal-action {
    font-size: 13px;
    font-weight: 600;
    color: var(--patient-primary);
    letter-spacing: 0.3px;
}

.terminal-indicator {
    display: flex;
    gap: 6px;
}

.indicator-dot {
    width: 7px;
    height: 7px;
    border-radius: var(--patient-radius-full);
    background: var(--patient-card-border);
    transition: all 0.3s ease;
}

.indicator-dot.active {
    background: var(--patient-primary);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.35);
}

/* ===== 底部提示 - 专业商务风 ===== */
.home-footer {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 28px !important;
    font-size: 12px;
    color: var(--patient-text-secondary);
    background: var(--patient-gradient-medical-subtle);
    border: 1px solid rgba(59, 130, 246, 0.15);
    border-radius: var(--patient-radius-lg);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.08);
    margin-top: auto;
    flex-shrink: 0;
    line-height: 1.6;
}
</style>
