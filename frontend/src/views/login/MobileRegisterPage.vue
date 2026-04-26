/**
* 移动端患者注册页面
* 触摸友好,简洁设计
*/
<template>
    <div class="mobile-register-page">
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
            <h1 class="brand-title">患者注册</h1>
            <p class="brand-desc">填写基本信息,开启智能诊断之旅</p>
        </div>

        <!-- 注册表单 -->
        <div class="register-form">
            <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
                <el-form-item label="患者编号" prop="patient_no">
                    <el-input v-model="form.patient_no" placeholder="由医院分配的患者编号" size="large" clearable>
                        <template #prefix>
                            <el-icon>
                                <Tickets />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>

                <el-form-item label="姓名" prop="name">
                    <el-input v-model="form.name" placeholder="请输入真实姓名" size="large" clearable>
                        <template #prefix>
                            <el-icon>
                                <User />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>

                <el-form-item label="性别" prop="gender">
                    <el-radio-group v-model="form.gender" class="gender-group">
                        <el-radio value="male" size="large">男</el-radio>
                        <el-radio value="female" size="large">女</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item label="年龄" prop="age">
                    <el-input-number v-model="form.age" :min="1" :max="150" size="large" class="age-input" />
                </el-form-item>

                <el-form-item label="联系电话" prop="phone">
                    <el-input v-model="form.phone" placeholder="请输入手机号码" size="large" clearable>
                        <template #prefix>
                            <el-icon>
                                <Phone />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" size="large" class="register-btn" :loading="loading"
                        @click="handleRegister" native-type="submit">
                        立即注册
                    </el-button>
                </el-form-item>
            </el-form>

            <!-- 提示信息 -->
            <div class="info-tips">
                <el-icon :size="16">
                    <InfoFilled />
                </el-icon>
                <div class="tips-content">
                    <p>• 患者编号由医院分配,请咨询医护人员</p>
                    <p>• 注册后可立即查看诊断报告</p>
                    <p>• 所有信息均加密保护,请放心填写</p>
                </div>
            </div>

            <!-- 底部链接 -->
            <div class="footer-links">
                <el-button text @click="goToLogin">
                    已有账号? <strong>立即登录</strong>
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
import { ArrowLeft, User, Tickets, Phone, InfoFilled } from '@element-plus/icons-vue'
import { registerPatientApi } from '@/api/patient-portal'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
    patient_no: '',
    name: '',
    gender: 'male',
    age: 30,
    phone: '',
})

const rules: FormRules = {
    patient_no: [
        { required: true, message: '请输入患者编号', trigger: 'blur' },
        { min: 3, max: 50, message: '编号长度为3-50个字符', trigger: 'blur' },
    ],
    name: [
        { required: true, message: '请输入姓名', trigger: 'blur' },
        { min: 2, max: 50, message: '姓名长度为2-50个字符', trigger: 'blur' },
    ],
    gender: [
        { required: true, message: '请选择性别', trigger: 'change' },
    ],
    age: [
        { required: true, message: '请输入年龄', trigger: 'blur' },
        { type: 'number', min: 1, max: 150, message: '年龄范围为1-150岁', trigger: 'blur' },
    ],
    phone: [
        { required: true, message: '请输入联系电话', trigger: 'blur' },
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' },
    ],
}

function goBack() {
    router.back()
}

async function handleRegister() {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
        if (!valid) return

        loading.value = true
        try {
            await registerPatientApi(form)
            ElMessage.success('注册成功,请登录')

            // 跳转到登录页
            setTimeout(() => {
                router.replace('/patient-login')
            }, 1000)
        } catch (error: any) {
            console.error('注册失败:', error)
        } finally {
            loading.value = false
        }
    })
}

function goToLogin() {
    router.push('/patient-login')
}
</script>

<style scoped lang="scss">
.mobile-register-page {
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
    padding: 32px 0 24px;

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

.register-form {
    background: white;
    border-radius: 20px;
    padding: 32px 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

    :deep(.el-form-item) {
        margin-bottom: 20px;
    }

    :deep(.el-form-item__label) {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        padding-bottom: 8px;
    }

    :deep(.el-input) {
        --el-input-height: 52px;
    }

    :deep(.el-input__wrapper) {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .gender-group {
        display: flex;
        gap: 16px;
        width: 100%;

        :deep(.el-radio) {
            flex: 1;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #E5E7EB;
            border-radius: 12px;
            margin-right: 0;
            transition: all 0.3s ease;

            &.is-checked {
                border-color: #667eea;
                background: rgba(102, 126, 234, 0.05);
            }

            .el-radio__label {
                font-size: 16px;
                font-weight: 600;
            }
        }
    }

    .age-input {
        width: 100%;

        :deep(.el-input-number__decrease),
        :deep(.el-input-number__increase) {
            width: 52px;
            height: 52px;
        }

        :deep(.el-input__wrapper) {
            padding: 0 60px;
        }
    }

    .register-btn {
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

.info-tips {
    background: #F3F4F6;
    border-radius: 12px;
    padding: 16px;
    margin-top: 24px;
    display: flex;
    gap: 12px;

    .el-icon {
        color: #667eea;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .tips-content {
        flex: 1;

        p {
            font-size: 13px;
            color: #6B7280;
            margin: 4px 0;
            line-height: 1.6;
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
