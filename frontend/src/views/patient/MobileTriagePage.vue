/**
* 移动端智能分诊页面
* 步骤式表单:症状选择 → 严重程度 → 提交评估
*/
<template>
    <div class="mobile-triage">
        <!-- 步骤指示器 -->
        <div class="steps-indicator">
            <div :class="['step-item', { active: currentStep >= 1, completed: currentStep > 1 }]">
                <div class="step-number">1</div>
                <span class="step-label">症状</span>
            </div>
            <div class="step-line" :class="{ active: currentStep > 1 }"></div>
            <div :class="['step-item', { active: currentStep >= 2, completed: currentStep > 2 }]">
                <div class="step-number">2</div>
                <span class="step-label">详情</span>
            </div>
            <div class="step-line" :class="{ active: currentStep > 2 }"></div>
            <div :class="['step-item', { active: currentStep >= 3 }]">
                <div class="step-number">3</div>
                <span class="step-label">结果</span>
            </div>
        </div>

        <!-- 步骤1: 症状选择 -->
        <div v-if="currentStep === 1" class="step-content">
            <div class="content-header">
                <h3>请选择您的症状</h3>
                <p class="hint">可多选,至少选择一个症状</p>
            </div>

            <div class="symptom-grid">
                <div v-for="symptom in symptomOptions" :key="symptom.id"
                    :class="['symptom-card', { selected: form.symptoms.includes(symptom.id) }]"
                    @click="toggleSymptom(symptom.id)">
                    <div class="symptom-icon" :style="{ background: symptom.bgColor }">
                        {{ symptom.icon }}
                    </div>
                    <span class="symptom-name">{{ symptom.label }}</span>
                </div>
            </div>

            <div class="step-actions">
                <el-button type="primary" size="large" block :disabled="form.symptoms.length === 0" @click="nextStep">
                    下一步
                </el-button>
            </div>
        </div>

        <!-- 步骤2: 症状详情 -->
        <div v-if="currentStep === 2" class="step-content">
            <div class="content-header">
                <h3>症状详细信息</h3>
                <p class="hint">请补充每个症状的具体情况</p>
            </div>

            <div class="symptom-details">
                <div v-for="symptomId in form.symptoms" :key="symptomId" class="detail-card">
                    <div class="detail-header">
                        <span class="detail-icon">{{ getSymptomById(symptomId)?.icon }}</span>
                        <span class="detail-title">{{ getSymptomById(symptomId)?.label }}</span>
                    </div>

                    <div class="detail-form">
                        <div class="form-item">
                            <label>严重程度</label>
                            <el-radio-group v-model="getSymptomDetail(symptomId).severity" size="small">
                                <el-radio-button value="mild">轻微</el-radio-button>
                                <el-radio-button value="moderate">中度</el-radio-button>
                                <el-radio-button value="severe">严重</el-radio-button>
                            </el-radio-group>
                        </div>

                        <div class="form-item">
                            <label>持续时间</label>
                            <el-select v-model="form.duration" placeholder="请选择" size="small">
                                <el-option label="1天以内" value="1d" />
                                <el-option label="1-3天" value="3d" />
                                <el-option label="3-7天" value="7d" />
                                <el-option label="1-2周" value="2w" />
                                <el-option label="2周以上" value="2w+" />
                            </el-select>
                        </div>

                        <div class="form-item">
                            <label>具体表现</label>
                            <el-input v-model="getSymptomDetail(symptomId).description" type="textarea" :rows="2"
                                placeholder="请描述症状的具体表现..." size="small" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="step-actions">
                <el-button size="large" block @click="prevStep">上一步</el-button>
                <el-button type="primary" size="large" block @click="submitTriage" :loading="submitting">
                    提交评估
                </el-button>
            </div>
        </div>

        <!-- 步骤3: 分诊结果 -->
        <div v-if="currentStep === 3" class="step-content">
            <div class="result-container">
                <div class="result-header" :class="urgencyLevel.class">
                    <el-icon :size="48">
                        <component :is="urgencyLevel.icon" />
                    </el-icon>
                    <h3>{{ urgencyLevel.title }}</h3>
                    <p>{{ urgencyLevel.desc }}</p>
                </div>

                <div class="result-body">
                    <div class="info-card">
                        <h4>评估建议</h4>
                        <p>{{ triageResult.advice }}</p>
                    </div>

                    <div class="info-card" v-if="triageResult.department">
                        <h4>推荐科室</h4>
                        <el-tag type="primary" size="large">{{ triageResult.department }}</el-tag>
                    </div>

                    <div class="info-card" v-if="triageResult.notes">
                        <h4>注意事项</h4>
                        <ul>
                            <li v-for="(note, idx) in triageResult.notes" :key="idx">{{ note }}</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="step-actions">
                <el-button size="large" block @click="resetForm">重新评估</el-button>
                <el-button type="primary" size="large" block @click="goToHome">
                    返回首页
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Warning, CircleCheck, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 当前步骤
const currentStep = ref(1)
const submitting = ref(false)

// 症状选项
const symptomOptions = [
    { id: 'cough', label: '咳嗽', icon: '😷', bgColor: 'rgba(14, 165, 233, 0.15)' },
    { id: 'fever', label: '发热', icon: '🌡️', bgColor: 'rgba(239, 68, 68, 0.15)' },
    { id: 'chest_pain', label: '胸痛', icon: '💔', bgColor: 'rgba(245, 158, 11, 0.15)' },
    { id: 'dyspnea', label: '呼吸困难', icon: '😮‍💨', bgColor: 'rgba(139, 92, 246, 0.15)' },
    { id: 'fatigue', label: '乏力', icon: '😴', bgColor: 'rgba(107, 114, 128, 0.15)' },
    { id: 'wheeze', label: '喘息', icon: '🫁', bgColor: 'rgba(16, 185, 129, 0.15)' },
]

// 表单数据
const form = ref({
    symptoms: [] as string[],
    duration: '',
    details: {} as Record<string, any>,
})

// 分诊结果
const triageResult = ref({
    urgency: 'normal',
    advice: '',
    department: '',
    notes: [] as string[],
})

// 获取症状对象
function getSymptomById(id: string) {
    return symptomOptions.find(s => s.id === id)
}

// 获取症状详情
function getSymptomDetail(id: string) {
    if (!form.value.details[id]) {
        form.value.details[id] = {
            severity: 'mild',
            description: '',
        }
    }
    return form.value.details[id]
}

// 切换症状选择
function toggleSymptom(id: string) {
    const index = form.value.symptoms.indexOf(id)
    if (index > -1) {
        form.value.symptoms.splice(index, 1)
    } else {
        form.value.symptoms.push(id)
    }
}

// 下一步
function nextStep() {
    if (form.value.symptoms.length === 0) {
        ElMessage.warning('请至少选择一个症状')
        return
    }
    currentStep.value++
}

// 上一步
function prevStep() {
    currentStep.value--
}

// 提交分诊
async function submitTriage() {
    submitting.value = true
    try {
        // 构建提交数据
        const data = {
            symptoms: form.value.symptoms.map(id => ({
                symptom_id: id,
                ...getSymptomDetail(id),
            })),
            duration: form.value.duration,
        }

        // TODO: 调用后端API
        // const res = await submitTriageApi(data)

        // 模拟结果
        setTimeout(() => {
            triageResult.value = {
                urgency: 'normal',
                advice: '根据您的症状描述,建议您尽快前往医院就诊,进行进一步的检查和诊断。',
                department: '呼吸内科',
                notes: [
                    '请携带既往病历和检查报告',
                    '就诊前避免剧烈运动',
                    '如有加重请立即就医',
                ],
            }
            currentStep.value = 3
            submitting.value = false
        }, 1500)
    } catch (error) {
        console.error('提交分诊失败:', error)
        ElMessage.error('提交失败,请重试')
        submitting.value = false
    }
}

// 重置表单
function resetForm() {
    form.value = {
        symptoms: [],
        duration: '',
        details: {},
    }
    currentStep.value = 1
}

// 跳转到首页
function goToHome() {
    router.push('/patient/mobile')
}

// 紧急程度配置
const urgencyLevel = computed(() => {
    const levels: Record<string, any> = {
        emergency: {
            class: 'emergency',
            icon: Warning,
            title: '紧急',
            desc: '建议立即就医',
        },
        urgent: {
            class: 'urgent',
            icon: Warning,
            title: '较急',
            desc: '建议尽快就医',
        },
        normal: {
            class: 'normal',
            icon: CircleCheck,
            title: '一般',
            desc: '建议择期就诊',
        },
    }
    return levels[triageResult.value.urgency] || levels.normal
})
</script>

<style scoped lang="scss">
@import '@/styles/mobile.scss';

.mobile-triage {
    min-height: 100%;
    height: 100%; // 确保填满父容器
    background: $mobile-bg;
    padding: $spacing-md;
}

// 步骤指示器
.steps-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-lg;
    padding: $spacing-md;
    background: white;
    border-radius: $radius-lg;
    box-shadow: $shadow-sm;
}

.step-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-xs;

    .step-number {
        width: 32px;
        height: 32px;
        border-radius: $radius-full;
        background: #E5E7EB;
        color: #9CA3AF;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: $text-sm;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .step-label {
        font-size: $text-xs;
        color: #9CA3AF;
        transition: all 0.3s ease;
    }

    &.active {
        .step-number {
            background: linear-gradient(135deg, $mobile-primary, $mobile-secondary);
            color: white;
        }

        .step-label {
            color: $mobile-primary;
            font-weight: 600;
        }
    }

    &.completed {
        .step-number {
            background: $mobile-success;
            color: white;
        }
    }
}

.step-line {
    width: 40px;
    height: 2px;
    background: #E5E7EB;
    margin: 0 $spacing-xs;
    transition: all 0.3s ease;

    &.active {
        background: $mobile-primary;
    }
}

// 步骤内容
.step-content {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.content-header {
    text-align: center;
    margin-bottom: $spacing-lg;

    h3 {
        font-size: $text-xl;
        color: $mobile-text;
        margin: 0 0 $spacing-xs 0;
    }

    .hint {
        font-size: $text-sm;
        color: $mobile-text-secondary;
        margin: 0;
    }
}

// 症状网格
.symptom-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-md;
    margin-bottom: $spacing-lg;
}

.symptom-card {
    background: white;
    border-radius: $radius-md;
    padding: $spacing-md;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;

    &:active {
        transform: scale(0.95);
    }

    &.selected {
        border-color: $mobile-primary;
        box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
}

.symptom-icon {
    width: 48px;
    height: 48px;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin: 0 auto $spacing-sm;
}

.symptom-name {
    font-size: $text-sm;
    color: $mobile-text;
    font-weight: 500;
}

// 症状详情卡片
.symptom-details {
    margin-bottom: $spacing-lg;
}

.detail-card {
    background: white;
    border-radius: $radius-md;
    padding: $spacing-md;
    margin-bottom: $spacing-md;
    box-shadow: $shadow-sm;
}

.detail-header {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    margin-bottom: $spacing-md;
    padding-bottom: $spacing-sm;
    border-bottom: 1px solid $mobile-border;
}

.detail-icon {
    font-size: 24px;
}

.detail-title {
    font-size: $text-md;
    font-weight: 600;
    color: $mobile-text;
}

.detail-form {
    .form-item {
        margin-bottom: $spacing-md;

        label {
            display: block;
            font-size: $text-sm;
            color: $mobile-text-secondary;
            margin-bottom: $spacing-xs;
        }
    }
}

// 操作按钮
.step-actions {
    display: flex;
    flex-direction: column;
    gap: $spacing-md;
}

// 结果容器
.result-container {
    margin-bottom: $spacing-lg;
}

.result-header {
    text-align: center;
    padding: $spacing-xl $spacing-md;
    border-radius: $radius-lg;
    margin-bottom: $spacing-lg;

    .el-icon {
        margin-bottom: $spacing-md;
    }

    h3 {
        font-size: $text-xxl;
        margin: 0 0 $spacing-xs 0;
    }

    p {
        font-size: $text-md;
        margin: 0;
    }

    &.emergency {
        background: linear-gradient(135deg, #FEE2E2, #FECACA);
        color: #DC2626;
    }

    &.urgent {
        background: linear-gradient(135deg, #FEF3C7, #FDE68A);
        color: #D97706;
    }

    &.normal {
        background: linear-gradient(135deg, #D1FAE5, #A7F3D0);
        color: #059669;
    }
}

.result-body {
    .info-card {
        background: white;
        border-radius: $radius-md;
        padding: $spacing-md;
        margin-bottom: $spacing-md;
        box-shadow: $shadow-sm;

        h4 {
            font-size: $text-md;
            color: $mobile-text;
            margin: 0 0 $spacing-sm 0;
        }

        p {
            font-size: $text-sm;
            color: $mobile-text-secondary;
            line-height: 1.6;
            margin: 0;
        }

        ul {
            margin: 0;
            padding-left: $spacing-md;

            li {
                font-size: $text-sm;
                color: $mobile-text-secondary;
                line-height: 1.8;
            }
        }
    }
}
</style>
