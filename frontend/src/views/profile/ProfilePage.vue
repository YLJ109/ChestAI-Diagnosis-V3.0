/** 个人信息中心页面 - 查看和编辑个人信息、修改密码 */
<template>
    <div class="profile-page">
        <div class="profile-container">
            <!-- 左侧个人信息卡片 -->
            <div class="profile-card glass-card">
                <div class="card-header">
                    <el-icon :size="20" class="header-icon">
                        <User />
                    </el-icon>
                    <span class="header-title">个人信息</span>
                </div>

                <div class="profile-content">
                    <!-- 头像区域 -->
                    <div class="avatar-section">
                        <el-avatar :size="80" class="profile-avatar">
                            {{ (profileForm.real_name || 'U').charAt(0).toUpperCase() }}
                        </el-avatar>
                        <div class="avatar-info">
                            <h3 class="user-display-name">{{ profileForm.real_name }}</h3>
                            <span class="user-role-badge" :class="profileForm.role">
                                {{ roleLabel }}
                            </span>
                        </div>
                    </div>

                    <!-- 信息表单 -->
                    <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-position="top"
                        class="info-form">
                        <el-form-item label="用户名" prop="username">
                            <el-input v-model="profileForm.username" disabled />
                            <span class="form-tip">用户名不可修改</span>
                        </el-form-item>

                        <el-form-item label="真实姓名" prop="real_name">
                            <el-input v-model="profileForm.real_name" placeholder="请输入真实姓名" />
                        </el-form-item>

                        <el-form-item label="角色" prop="role">
                            <el-input v-model="roleLabel" disabled />
                        </el-form-item>

                        <el-form-item label="科室" prop="department" v-if="profileForm.role !== 'admin'">
                            <el-input v-model="profileForm.department" placeholder="请输入所在科室" />
                        </el-form-item>

                        <el-form-item label="执业证号" prop="license_number" v-if="profileForm.role === 'doctor'">
                            <el-input v-model="profileForm.license_number" placeholder="请输入执业医师证号" />
                        </el-form-item>

                        <el-form-item label="邮箱" prop="email">
                            <el-input v-model="profileForm.email" placeholder="请输入邮箱地址" />
                        </el-form-item>

                        <el-form-item label="手机号" prop="phone">
                            <el-input v-model="profileForm.phone" placeholder="请输入手机号" />
                        </el-form-item>

                        <el-form-item label="账号状态">
                            <el-tag :type="profileForm.status === 'active' ? 'success' : 'danger'" size="large">
                                {{ profileForm.status === 'active' ? '启用' : '禁用' }}
                            </el-tag>
                        </el-form-item>

                        <el-form-item label="最后登录">
                            <el-input :model-value="profileForm.last_login_at || '从未登录'" disabled />
                        </el-form-item>

                        <el-form-item label="创建时间">
                            <el-input :model-value="profileForm.created_at || '-'" disabled />
                        </el-form-item>
                    </el-form>

                    <!-- 操作按钮 -->
                    <div class="form-actions">
                        <el-button @click="resetForm" size="large">
                            <el-icon>
                                <Refresh />
                            </el-icon> 重置
                        </el-button>
                        <el-button type="primary" @click="saveProfile" :loading="saving" size="large">
                            <el-icon>
                                <Check />
                            </el-icon> 保存修改
                        </el-button>
                    </div>
                </div>
            </div>

            <!-- 右侧修改密码卡片 -->
            <div class="password-card glass-card">
                <div class="card-header">
                    <el-icon :size="20" class="header-icon">
                        <Lock />
                    </el-icon>
                    <span class="header-title">修改密码</span>
                </div>

                <div class="password-content">
                    <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-position="top"
                        class="password-form">
                        <el-form-item label="原密码" prop="old_password">
                            <el-input v-model="passwordForm.old_password" type="password" placeholder="请输入原密码"
                                show-password />
                        </el-form-item>

                        <el-form-item label="新密码" prop="new_password">
                            <el-input v-model="passwordForm.new_password" type="password" placeholder="请输入新密码（至少6位）"
                                show-password />
                        </el-form-item>

                        <el-form-item label="确认新密码" prop="confirm_password">
                            <el-input v-model="passwordForm.confirm_password" type="password" placeholder="请再次输入新密码"
                                show-password />
                        </el-form-item>

                        <!-- 密码要求提示 -->
                        <div class="password-requirements">
                            <div class="req-title">密码要求：</div>
                            <ul class="req-list">
                                <li :class="{ met: passwordForm.new_password.length >= 6 }">
                                    <el-icon :size="14">
                                        <CircleCheckFilled v-if="passwordForm.new_password.length >= 6" />
                                        <CloseBold v-else />
                                    </el-icon>
                                    长度至少6位
                                </li>
                                <li :class="{ met: passwordForm.new_password.length >= 8 }">
                                    <el-icon :size="14">
                                        <CircleCheckFilled v-if="passwordForm.new_password.length >= 8" />
                                        <CloseBold v-else />
                                    </el-icon>
                                    建议8位以上
                                </li>
                                <li
                                    :class="{ met: /[A-Z]/.test(passwordForm.new_password) && /[a-z]/.test(passwordForm.new_password) }">
                                    <el-icon :size="14">
                                        <CircleCheckFilled
                                            v-if="/[A-Z]/.test(passwordForm.new_password) && /[a-z]/.test(passwordForm.new_password)" />
                                        <CloseBold v-else />
                                    </el-icon>
                                    包含大小写字母
                                </li>
                                <li :class="{ met: /[0-9]/.test(passwordForm.new_password) }">
                                    <el-icon :size="14">
                                        <CircleCheckFilled v-if="/[0-9]/.test(passwordForm.new_password)" />
                                        <CloseBold v-else />
                                    </el-icon>
                                    包含数字
                                </li>
                                <li
                                    :class="{ met: passwordForm.old_password !== passwordForm.new_password && passwordForm.new_password.length > 0 }">
                                    <el-icon :size="14">
                                        <CircleCheckFilled
                                            v-if="passwordForm.old_password !== passwordForm.new_password && passwordForm.new_password.length > 0" />
                                        <CloseBold v-else />
                                    </el-icon>
                                    与原密码不同
                                </li>
                            </ul>
                        </div>
                    </el-form>

                    <div class="form-actions">
                        <el-button @click="resetPasswordForm" size="large">
                            <el-icon>
                                <Refresh />
                            </el-icon> 重置
                        </el-button>
                        <el-button type="primary" @click="changePassword" :loading="changing" size="large">
                            <el-icon>
                                <Check />
                            </el-icon> 确认修改
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Refresh, Check, CircleCheckFilled, CloseBold } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getProfileApi, updateProfileApi, changePasswordApi } from '@/api/auth'

const authStore = useAuthStore()

// 角色标签映射
const roleLabelMap: Record<string, string> = {
    admin: '系统管理员',
    doctor: '医生',
    nurse: '护士',
}

const roleLabel = computed(() => roleLabelMap[profileForm.role] || profileForm.role)

// 个人信息表单
const profileFormRef = ref()
const saving = ref(false)

const profileForm = reactive({
    id: 0,
    username: '',
    real_name: '',
    role: '',
    department: '',
    license_number: '',
    email: '',
    phone: '',
    status: '',
    last_login_at: '',
    created_at: '',
})

const profileRules = {
    real_name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
    email: [
        { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
    ],
    phone: [
        { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
    ],
}

// 修改密码表单
const passwordFormRef = ref()
const changing = ref(false)

const passwordForm = reactive({
    old_password: '',
    new_password: '',
    confirm_password: '',
})

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
    if (value !== passwordForm.new_password) {
        callback(new Error('两次输入的密码不一致'))
    } else {
        callback()
    }
}

const passwordRules = {
    old_password: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
    new_password: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        { min: 6, message: '密码长度至少6位', trigger: 'blur' },
    ],
    confirm_password: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' },
    ],
}

// 获取个人信息
async function fetchProfile() {
    try {
        const res: any = await getProfileApi()
        const data = res.data
        Object.assign(profileForm, {
            id: data.id,
            username: data.username,
            real_name: data.real_name,
            role: data.role,
            department: data.department || '',
            license_number: data.license_number || '',
            email: data.email || '',
            phone: data.phone || '',
            status: data.status || 'active',
            last_login_at: data.last_login_at || '',
            created_at: data.created_at || '',
        })
    } catch (error: any) {
        ElMessage.error(error.message || '获取个人信息失败')
    }
}

// 保存个人信息
async function saveProfile() {
    const valid = await profileFormRef.value.validate().catch(() => false)
    if (!valid) return

    saving.value = true
    try {
        const data = {
            real_name: profileForm.real_name,
            department: profileForm.department,
            license_number: profileForm.license_number,
            email: profileForm.email,
            phone: profileForm.phone,
        }
        await updateProfileApi(data)
        ElMessage.success('个人信息更新成功')

        // 更新本地用户信息
        authStore.user.real_name = profileForm.real_name
        localStorage.setItem('user', JSON.stringify(authStore.user))
    } catch (error: any) {
        ElMessage.error(error.message || '更新失败')
    } finally {
        saving.value = false
    }
}

// 重置个人信息表单
function resetForm() {
    fetchProfile()
    ElMessage.info('已重置为原始数据')
}

// 修改密码
async function changePassword() {
    const valid = await passwordFormRef.value.validate().catch(() => false)
    if (!valid) return

    changing.value = true
    try {
        await changePasswordApi({
            old_password: passwordForm.old_password,
            new_password: passwordForm.new_password,
        })
        ElMessage.success('密码修改成功，请重新登录')

        // 清空密码表单
        resetPasswordForm()

        // 延迟退出登录
        setTimeout(() => {
            authStore.logout()
            window.location.href = '/login'
        }, 1500)
    } catch (error: any) {
        ElMessage.error(error.message || '密码修改失败')
    } finally {
        changing.value = false
    }
}

// 重置密码表单
function resetPasswordForm() {
    passwordForm.old_password = ''
    passwordForm.new_password = ''
    passwordForm.confirm_password = ''
    passwordFormRef.value?.clearValidate()
}

onMounted(() => {
    fetchProfile()
})
</script>

<style scoped lang="scss">
.profile-page {
    padding: 24px;
    height: 100%;
    overflow-y: auto;
}

.profile-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    max-width: 1600px;
    margin: 0 auto;

    @media (max-width: 1200px) {
        grid-template-columns: 1fr;
    }
}

.glass-card {
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 16px var(--shadow-sm);
    overflow: hidden;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    border-bottom: 1px solid var(--glass-border);
    background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.05), rgba(var(--primary-rgb), 0.02));

    .header-icon {
        color: var(--primary);
    }

    .header-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
    }
}

// 个人信息卡片
.profile-card {
    .profile-content {
        padding: 24px;
    }

    .avatar-section {
        display: flex;
        align-items: center;
        gap: 20px;
        padding: 20px;
        margin-bottom: 24px;
        background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.08), rgba(var(--primary-rgb), 0.03));
        border-radius: var(--radius-md);
        border: 1px solid rgba(var(--primary-rgb), 0.15);

        .profile-avatar {
            background: var(--gradient-primary);
            color: #fff;
            font-weight: 700;
            font-size: 32px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
        }

        .avatar-info {
            flex: 1;

            .user-display-name {
                font-size: 22px;
                font-weight: 700;
                color: var(--text-primary);
                margin: 0 0 8px 0;
            }

            .user-role-badge {
                display: inline-block;
                padding: 4px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 600;

                &.admin {
                    background: rgba(239, 68, 68, 0.15);
                    color: #F87171;
                }

                &.doctor {
                    background: rgba(var(--primary-rgb), 0.2);
                    color: var(--primary);
                }

                &.nurse {
                    background: rgba(59, 130, 246, 0.15);
                    color: var(--blue);
                }
            }
        }
    }

    .info-form {
        :deep(.el-form-item) {
            margin-bottom: 18px;
        }

        :deep(.el-form-item__label) {
            font-weight: 500;
            color: var(--text-secondary);
            font-size: 13px;
            margin-bottom: 6px;
        }

        .form-tip {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 4px;
            display: block;
        }
    }
}

// 修改密码卡片
.password-card {
    .password-content {
        padding: 24px;
    }

    .password-form {
        :deep(.el-form-item) {
            margin-bottom: 20px;
        }

        :deep(.el-form-item__label) {
            font-weight: 500;
            color: var(--text-secondary);
            font-size: 13px;
            margin-bottom: 6px;
        }
    }

    .password-requirements {
        margin: 16px 0 24px 0;
        padding: 16px;
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border: 1px solid var(--glass-border);

        .req-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 10px;
        }

        .req-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 8px;

            li {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: var(--text-secondary);
                transition: all 0.3s ease;

                &.met {
                    color: var(--primary);

                    .el-icon {
                        color: var(--primary);
                    }
                }

                .el-icon {
                    flex-shrink: 0;
                    color: var(--text-muted);
                    transition: color 0.3s ease;
                }
            }
        }
    }
}

// 操作按钮
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--glass-border);

    :deep(.el-button) {
        min-width: 120px;
        font-weight: 500;
    }
}
</style>
