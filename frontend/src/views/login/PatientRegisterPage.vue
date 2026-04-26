/** 患者自助注册页面 */
<template>
    <div class="patient-register-page">
        <!-- 顶部栏 -->
        <div class="terminal-header">
            <div class="header-left">
                <el-icon :size="24" color="#22d3ee">
                    <Monitor />
                </el-icon>
                <span class="header-title">患者自助服务终端</span>
            </div>
            <div class="header-right">
                <el-button text size="small" class="back-link" @click="goBack">
                    <el-icon>
                        <ArrowLeft />
                    </el-icon>
                    返回登录
                </el-button>
            </div>
        </div>

        <!-- 主内容区 -->
        <div class="register-main">
            <!-- 左侧：品牌信息 -->
            <div class="brand-section">
                <div class="brand-logo-large">
                    <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M914.28 950.86H109.72c-20.2 0-36.57 16.37-36.57 36.57S89.52 1024 109.72 1024h804.57c20.2 0 36.57-16.37 36.57-36.57s-16.38-36.57-36.58-36.57zM877.71 0H146.28C65.6 0.24 0.24 65.6 0 146.28v585.14c0.24 80.69 65.6 146.04 146.28 146.28h731.43c80.69-0.24 146.05-65.59 146.29-146.28V146.28C1023.76 65.6 958.4 0.24 877.71 0z"
                            fill="#22d3ee" />
                    </svg>
                </div>
                <h1 class="brand-title">患者注册</h1>
                <p class="brand-subtitle">Patient Self-Registration</p>
                <p class="brand-desc">请填写您的基本信息完成注册</p>

                <!-- 提示信息 -->
                <div class="info-tips">
                    <el-icon :size="16">
                        <InfoFilled />
                    </el-icon>
                    <div class="tips-content">
                        <p>• 患者编号由医院分配，请咨询医护人员</p>
                        <p>• 注册后可立即查看诊断报告</p>
                        <p>• 所有信息均加密保护，请放心填写</p>
                    </div>
                </div>
            </div>

            <!-- 右侧：注册表单 -->
            <div class="form-section">
                <div class="form-card">
                    <h2 class="form-title">基本信息</h2>

                    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" size="large">
                        <!-- 患者编号 -->
                        <el-form-item label="患者编号" prop="patient_no">
                            <el-input v-model="form.patient_no" placeholder="请输入医院分配的患者编号" clearable>
                                <template #prefix>
                                    <el-icon>
                                        <Ticket />
                                    </el-icon>
                                </template>
                            </el-input>
                        </el-form-item>

                        <!-- 姓名 -->
                        <el-form-item label="姓名" prop="name">
                            <el-input v-model="form.name" placeholder="请输入真实姓名" clearable>
                                <template #prefix>
                                    <el-icon>
                                        <User />
                                    </el-icon>
                                </template>
                            </el-input>
                        </el-form-item>

                        <!-- 性别 -->
                        <el-form-item label="性别" prop="gender">
                            <el-radio-group v-model="form.gender" class="gender-group">
                                <el-radio value="male" size="large">
                                    <el-icon>
                                        <Male />
                                    </el-icon>
                                    男
                                </el-radio>
                                <el-radio value="female" size="large">
                                    <el-icon>
                                        <Female />
                                    </el-icon>
                                    女
                                </el-radio>
                            </el-radio-group>
                        </el-form-item>

                        <!-- 年龄 -->
                        <el-form-item label="年龄" prop="age">
                            <el-input-number v-model="form.age" :min="1" :max="150" placeholder="选填"
                                style="width: 100%" />
                        </el-form-item>

                        <!-- 手机号 -->
                        <el-form-item label="手机号" prop="phone">
                            <el-input v-model="form.phone" placeholder="选填，用于接收通知" clearable>
                                <template #prefix>
                                    <el-icon>
                                        <Phone />
                                    </el-icon>
                                </template>
                            </el-input>
                        </el-form-item>

                        <!-- 提交按钮 -->
                        <el-form-item>
                            <el-button type="primary" size="large" class="submit-btn" @click="handleSubmit"
                                :loading="submitting">
                                <el-icon>
                                    <CircleCheck />
                                </el-icon>
                                完成注册
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Monitor, ArrowLeft, InfoFilled, Ticket, User, Male, Female, Phone, CircleCheck } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { patientRegisterApi } from '@/api/auth'
import { sanitizeInput, validatePhone } from '@/utils/xss'

const router = useRouter()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const form = reactive({
    patient_no: '',
    name: '',
    gender: 'male',
    age: undefined as number | undefined,
    phone: ''
})

const rules: FormRules = {
    patient_no: [
        { required: true, message: '请输入患者编号', trigger: 'blur' },
        { min: 3, max: 50, message: '编号长度为3-50个字符', trigger: 'blur' }
    ],
    name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 20, message: '姓名长度为2-20个字符', trigger: 'blur' }
    ],
    gender: [
        { required: true, message: '请选择性别', trigger: 'change' }
    ],
    phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号', trigger: 'blur' }
    ]
}

async function handleSubmit() {
    const valid = await formRef.value?.validate().catch(() => false)
    if (!valid) return

    // XSS防护: 清理输入数据
    try {
        form.name = sanitizeInput(form.name, { maxLength: 20 })
        form.patient_no = sanitizeInput(form.patient_no, { maxLength: 50 })

        // 验证手机号
        if (form.phone && !validatePhone(form.phone)) {
            ElMessage.error('请输入有效的手机号')
            return
        }
    } catch (error: any) {
        ElMessage.error(error.message || '输入内容不合法')
        return
    }

    submitting.value = true
    try {
        await patientRegisterApi(form)
        ElMessage.success('注册成功！请登录')

        // 延迟跳转到登录页
        setTimeout(() => {
            router.push('/patient-login')
        }, 1500)
    } catch (err: any) {
        console.error('注册失败:', err)
        ElMessage.error(err.response?.data?.message || '注册失败，请重试')
    } finally {
        submitting.value = false
    }
}

function goBack() {
    router.push('/patient-login')
}
</script>

<style scoped lang="scss">
.patient-register-page {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    overflow: hidden;
}

/* ===== 顶部栏 ===== */
.terminal-header {
    height: 64px;
    padding: 0 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(34, 211, 238, 0.2);
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.header-title {
    font-size: 18px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: 1px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 16px;
}

.back-link {
    color: #94a3b8;
    font-size: 14px;
    transition: all 0.3s ease;

    &:hover {
        color: #22d3ee;
    }
}

/* ===== 主内容区 ===== */
.register-main {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    overflow: hidden;
}

/* 左侧品牌区 */
.brand-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 40px;
    background: linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(59, 130, 246, 0.05));
    position: relative;
}

.brand-logo-large {
    width: 120px;
    height: 120px;
    margin-bottom: 24px;
    filter: drop-shadow(0 0 30px rgba(34, 211, 238, 0.4));
    animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.05);
        opacity: 0.9;
    }
}

.brand-title {
    font-size: 36px;
    font-weight: 800;
    color: #f1f5f9;
    margin: 0 0 8px 0;
    letter-spacing: 2px;
}

.brand-subtitle {
    font-size: 14px;
    color: #94a3b8;
    margin: 0 0 16px 0;
    letter-spacing: 1px;
}

.brand-desc {
    font-size: 15px;
    color: #cbd5e1;
    margin: 0 0 40px 0;
    text-align: center;
}

.info-tips {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 20px 24px;
    background: rgba(34, 211, 238, 0.1);
    border: 1px solid rgba(34, 211, 238, 0.3);
    border-radius: 12px;
    color: #22d3ee;
    max-width: 400px;

    .tips-content {
        flex: 1;

        p {
            margin: 6px 0;
            font-size: 13px;
            line-height: 1.6;
        }
    }
}

/* 右侧表单区 */
.form-section {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
}

.form-card {
    width: 100%;
    max-width: 480px;
    padding: 40px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(34, 211, 238, 0.2);
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.form-title {
    font-size: 24px;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 32px 0;
    text-align: center;
}

.gender-group {
    display: flex;
    gap: 24px;
    width: 100%;

    :deep(.el-radio) {
        flex: 1;
        margin: 0;
        padding: 12px 16px;
        border: 2px solid rgba(148, 163, 184, 0.3);
        border-radius: 10px;
        transition: all 0.3s ease;

        &:hover {
            border-color: #22d3ee;
            background: rgba(34, 211, 238, 0.1);
        }

        &.is-checked {
            border-color: #22d3ee;
            background: rgba(34, 211, 238, 0.15);
        }
    }
}

.submit-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, #22d3ee, #3b82f6);
    border: none;
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(34, 211, 238, 0.3);
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(34, 211, 238, 0.4);
    }

    &:active {
        transform: translateY(0);
    }
}

/* 响应式 */
@media (max-width: 1024px) {
    .register-main {
        grid-template-columns: 1fr;
    }

    .brand-section {
        display: none;
    }
}

/* 移动端适配 */
@media (max-width: 768px) {
    .patient-register-page {
        min-height: 100vh;
    }

    .terminal-header {
        padding: 12px 16px;
    }

    .header-title {
        font-size: 16px;
    }

    .register-main {
        padding: 16px;
    }

    .form-card {
        max-width: 100%;
        padding: 24px 20px;
        border-radius: 16px;
    }

    .form-title {
        font-size: 20px;
        margin-bottom: 24px;
    }

    :deep(.el-form-item__label) {
        font-size: 14px;
    }

    :deep(.el-input),
    :deep(.el-input-number) {
        --el-input-height: 44px;
    }

    .gender-group {
        gap: 12px;

        :deep(.el-radio) {
            padding: 10px 12px;
        }
    }

    .submit-btn {
        height: 48px;
        font-size: 16px;
    }

    .info-tips {
        padding: 16px;
        margin-top: 24px;

        .tips-content p {
            font-size: 13px;
        }
    }
}
</style>
