/**
* 移动端患者登录页面
* 触摸友好,简洁设计
*/
<template>
    <div class="mobile-login-page">
        <!-- 顶部Header -->
        <div class="page-header">
            <el-button text @click="goBack" class="back-btn">
                <el-icon>
                    <ArrowLeft />
                </el-icon>
                返回
            </el-button>
        </div>

        <!-- Logo和品牌 -->
        <div class="brand-section">
            <div class="logo-wrapper">
                <svg viewBox="0 0 1024 1024" class="logo-svg">
                    <path
                        d="M914.28 950.86H109.72c-20.2 0-36.57 16.37-36.57 36.57S89.52 1024 109.72 1024h804.57c20.2 0 36.57-16.37 36.57-36.57s-16.38-36.57-36.58-36.57zM877.71 0H146.28C65.6 0.24 0.24 65.6 0 146.28v585.14c0.24 80.69 65.6 146.04 146.28 146.28h731.43c80.69-0.24 146.05-65.59 146.29-146.28V146.28C1023.76 65.6 958.4 0.24 877.71 0z"
                        fill="#667eea" />
                </svg>
            </div>
            <h1 class="brand-title">欢迎回来</h1>
            <p class="brand-desc">登录胸影智诊,查看您的诊断报告</p>
        </div>

        <!-- 登录表单 -->
        <div class="login-form">
            <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
                <el-form-item prop="patient_no">
                    <el-input v-model="form.patient_no" placeholder="请输入患者编号" size="large" clearable>
                        <template #prefix>
                            <el-icon>
                                <User />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin"
                        native-type="submit">
                        登录
                    </el-button>
                </el-form-item>
            </el-form>

            <!-- 其他登录方式 -->
            <div class="other-methods">
                <div class="divider">
                    <span>或者</span>
                </div>
                <el-button size="large" class="face-login-btn" @click="goToFaceLogin">
                    <el-icon>
                        <Camera />
                    </el-icon>
                    人脸识别登录
                </el-button>
            </div>

            <!-- 底部链接 -->
            <div class="footer-links">
                <el-button text @click="goToRegister">
                    还没有账号? <strong>立即注册</strong>
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { ArrowLeft, User, Camera } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
    patient_no: '',
})

const rules: FormRules = {
    patient_no: [
        { required: true, message: '请输入患者编号', trigger: 'blur' },
        { min: 3, max: 50, message: '编号长度为3-50个字符', trigger: 'blur' },
    ],
}

function goBack() {
    router.back()
}

async function handleLogin() {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (!valid) return

        loading.value = true
        try {
            await authStore.patientLogin(form.patient_no, 'patient_no')
            ElMessage.success('登录成功')

            // 跳转到移动端主页
            setTimeout(() => {
                router.replace('/patient/mobile')
            }, 500)
        } catch (error: any) {
            console.error('登录失败:', error)
        } finally {
            loading.value = false
        }
    })
}

function goToFaceLogin() {
    router.push('/patient-login/face')
}

function goToRegister() {
    router.push('/patient-register')
}
</script>

<style scoped lang="scss">
.mobile-login-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 0 20px 40px;
    display: flex;
    flex-direction: column;
}

.page-header {
    padding: 16px 0;

    .back-btn {
        color: white;
        font-size: 15px;
        padding: 0;
    }
}

.brand-section {
    text-align: center;
    padding: 40px 0 32px;

    .logo-wrapper {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(10px);

        .logo-svg {
            width: 50px;
            height: 50px;
        }
    }

    .brand-title {
        font-size: 28px;
        font-weight: 700;
        color: white;
        margin: 0 0 12px 0;
    }

    .brand-desc {
        font-size: 15px;
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
        line-height: 1.6;
    }
}

.login-form {
    background: white;
    border-radius: 20px;
    padding: 32px 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    :deep(.el-form-item) {
        margin-bottom: 20px;
    }

    :deep(.el-input) {
        --el-input-height: 52px;
    }

    :deep(.el-input__wrapper) {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .login-btn {
        width: 100%;
        height: 52px;
        font-size: 17px;
        font-weight: 600;
        border-radius: 12px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        margin-top: 8px;

        &:active {
            transform: scale(0.98);
        }
    }
}

.other-methods {
    margin-top: 24px;

    .divider {
        display: flex;
        align-items: center;
        margin: 24px 0;

        &::before,
        &::after {
            content: '';
            flex: 1;
            height: 1px;
            background: #E5E7EB;
        }

        span {
            padding: 0 16px;
            font-size: 14px;
            color: #9CA3AF;
        }
    }

    .face-login-btn {
        width: 100%;
        height: 52px;
        font-size: 16px;
        font-weight: 600;
        border-radius: 12px;
        border: 2px solid #667eea;
        color: #667eea;
        background: white;

        &:active {
            background: #F9FAFB;
        }
    }
}

.footer-links {
    text-align: center;
    margin-top: 24px;

    .el-button {
        font-size: 15px;
        color: #6B7280;

        strong {
            color: #667eea;
            font-weight: 600;
        }
    }
}
</style>
