/** 管理员-患者管理页面 */
<template>
  <div class="patients-page">
    <!-- 统计卡片 -->
    <div class="stats-bar">
      <div class="stat-item">
        <div class="stat-icon" style="background: linear-gradient(135deg, #0EA5E9, #06B6D4);">
          <el-icon :size="24">
            <User />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ pagination.total }}</div>
          <div class="stat-label">患者总数</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon" style="background: linear-gradient(135deg, #10B981, #059669);">
          <el-icon :size="24">
            <CircleCheck />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ faceEnrolledCount }}</div>
          <div class="stat-label">已录入人脸</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon" style="background: linear-gradient(135deg, #F59E0B, #D97706);">
          <el-icon :size="24">
            <UserFilled />
          </el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ pagination.total - faceEnrolledCount }}</div>
          <div class="stat-label">待录入人脸</div>
        </div>
      </div>
    </div>

    <div class="glass-card">
      <!-- 搜索筛选栏 - 单行紧凑布局 -->
      <div class="filter-bar">
        <el-input v-model="filters.keyword" placeholder="姓名/编号/手机/身份证" clearable @keyup.enter="search"
          style="width: 260px;">
          <template #prefix><el-icon>
              <Search />
            </el-icon></template>
        </el-input>
        <el-select v-model="filters.gender" placeholder="性别" clearable style="width: 120px;">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
        </el-select>
        <el-select v-model="filters.face_status" placeholder="人脸状态" clearable style="width: 130px;">
          <el-option label="已录入" value="enrolled" />
          <el-option label="未录入" value="not_enrolled" />
        </el-select>
        <div class="filter-actions">
          <el-button type="primary" @click="search">
            <el-icon>
              <Search />
            </el-icon> 搜索
          </el-button>
          <el-button @click="resetFilters">
            <el-icon>
              <Refresh />
            </el-icon> 重置
          </el-button>
          <el-divider direction="vertical" />
          <el-button type="danger" plain :disabled="selectedRows.length === 0" @click="handleBatchDelete">
            <el-icon>
              <Delete />
            </el-icon> 批量删除 ({{ selectedRows.length }})
          </el-button>
          <el-button type="success" plain @click="handleExport">
            <el-icon>
              <Download />
            </el-icon> 导出
          </el-button>
          <el-button type="primary" @click="openDialog('create')">
            <el-icon>
              <Plus />
            </el-icon> 新增患者
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" empty-text="暂无患者数据" class="glass-table"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="patient_no" label="患者编号" min-width="120" />
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column label="性别" width="70">
          <template #default="{ row }">
            <span class="gender-badge" :class="row.gender">
              {{ row.gender === 'male' ? '男' : row.gender === 'female' ? '女' : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="65">
          <template #default="{ row }">{{ row.age != null ? row.age + '岁' : '-' }}</template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="blood_type" label="血型" width="65" show-overflow-tooltip />
        <el-table-column prop="medical_history" label="既往病史" min-width="140" show-overflow-tooltip />
        <el-table-column prop="allergy_history" label="过敏史" min-width="100" show-overflow-tooltip />
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="人脸" width="85">
          <template #default="{ row }">
            <el-tag v-if="row.has_face" type="success" size="small" effect="plain">
              <el-icon>
                <CircleCheck />
              </el-icon> 已录入
            </el-tag>
            <el-tag v-else type="info" size="small" effect="plain">未录入</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" class="action-link"
              @click="openDialog('edit', row)">编辑</el-button>
            <el-button :type="row.has_face ? 'warning' : 'success'" link size="small" class="action-link"
              @click="openFaceEnrollDialog(row)">
              <el-icon>
                <Camera />
              </el-icon>
              {{ row.has_face ? '更新' : '录入' }}
            </el-button>
            <el-button type="success" link size="small" class="action-link" @click="openQrcodeDialog(row)">
              <el-icon>
                <Ticket />
              </el-icon> 二维码
            </el-button>
            <el-popconfirm title="确定删除此患者？" @confirm="handleDelete(row)">
              <template #reference>
                <el-button type="danger" link size="small" class="action-link">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.per_page"
          :total="pagination.total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData" @current-change="fetchData" />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增患者' : '编辑患者'" width="650px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="80px" size="default">
        <el-form-item label="患者编号" prop="patient_no">
          <el-input v-model="formData.patient_no" placeholder="请输入患者编号" :disabled="dialogMode === 'edit'" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="formData.age" :min="0" :max="150" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="formData.phone" placeholder="联系电话" />
        </el-form-item>
        <el-form-item label="血型">
          <el-select v-model="formData.blood_type" style="width: 120px" clearable>
            <el-option label="A型" value="A" />
            <el-option label="B型" value="B" />
            <el-option label="AB型" value="AB" />
            <el-option label="O型" value="O" />
          </el-select>
        </el-form-item>
        <el-form-item label="既往病史">
          <el-input v-model="formData.medical_history" type="textarea" :rows="2" placeholder="既往病史" />
        </el-form-item>
        <el-form-item label="过敏史">
          <el-input v-model="formData.allergy_history" placeholder="过敏史" />
        </el-form-item>
        <el-form-item label="人脸照片">
          <div class="face-upload-section">
            <el-upload ref="faceUploadRef" :auto-upload="false" :on-change="handleFaceFileChange" accept="image/*"
              :show-file-list="false" :disabled="dialogMode === 'edit' && !editHasFace">
              <div class="face-upload-area">
                <img v-if="facePreview" :src="facePreview" class="face-preview-img" />
                <div v-else class="face-upload-placeholder">
                  <el-icon :size="48" color="#909399">
                    <Camera />
                  </el-icon>
                  <p class="upload-text">{{ editHasFace ? '已录入人脸（不可修改）' : '点击上传人脸照片' }}</p>
                  <p class="upload-hint">支持 JPG/PNG 格式，不超过 5MB</p>
                </div>
              </div>
            </el-upload>
            <div v-if="facePreview && !(dialogMode === 'edit' && !editHasFace)" class="face-actions">
              <el-button size="small" @click="clearFacePreview">清除</el-button>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 患者二维码对话框 -->
    <PatientQrcodeDialog v-model="qrcodeDialogVisible" :patient-id="currentPatientId" />

    <!-- 人脸录入对话框 -->
    <el-dialog v-model="faceEnrollDialogVisible" title="录入患者人脸" width="600px" :close-on-click-modal="false">
      <div class="face-enroll-container">
        <!-- 患者信息 -->
        <div class="patient-info-box">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="患者编号">{{ currentPatient?.patient_no }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ currentPatient?.name }}</el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ currentPatient?.gender === 'male' ? '男' : currentPatient?.gender === 'female' ? '女' : '未知' }}
            </el-descriptions-item>
            <el-descriptions-item label="年龄">
              {{ currentPatient?.age ? currentPatient.age + '岁' : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 上传区域 -->
        <div class="upload-section">
          <el-upload ref="uploadRef" class="face-uploader" drag action="#" :auto-upload="false" :show-file-list="false"
            :on-change="handleFileChange" accept="image/jpeg,image/png,image/jpg" :limit="1">
            <div v-if="!previewImage" class="upload-placeholder">
              <el-icon :size="64" color="#409EFF">
                <UploadFilled />
              </el-icon>
              <div class="upload-text">
                <p class="upload-title">点击或拖拽上传患者照片</p>
                <p class="upload-hint">支持 JPG/PNG 格式，建议正面免冠照</p>
              </div>
            </div>
            <div v-else class="preview-container">
              <img :src="previewImage" alt="预览" class="preview-image" />
              <div class="preview-overlay">
                <el-button type="danger" size="small" @click.stop="clearPreview">
                  <el-icon>
                    <Delete />
                  </el-icon> 删除
                </el-button>
              </div>
            </div>
          </el-upload>
        </div>

        <!-- 提示信息 -->
        <el-alert title="人脸录入要求" type="info" :closable="false" show-icon class="enroll-tips">
          <template #default>
            <ul>
              <li>请使用患者近期正面免冠照片</li>
              <li>光线充足，面部清晰无遮挡</li>
              <li>分辨率建议 640x480 以上</li>
              <li>文件大小不超过 5MB</li>
            </ul>
          </template>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="faceEnrollDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="faceEnrolling" :disabled="!selectedFile" @click="handleFaceEnroll">
          {{ faceEnrolling ? '正在录入...' : '确认录入' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Ticket, CircleCheck, Camera, UploadFilled, Delete, Download, User, UserFilled } from '@element-plus/icons-vue'
import { getPatientsApi, createPatientApi, updatePatientApi, deletePatientApi } from '@/api/patients'
import { enrollFaceApi } from '@/api/face'
import PatientQrcodeDialog from '@/components/PatientQrcodeDialog.vue'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editId = ref<number | null>(null)
const formRef = ref<any>(null)

// 二维码对话框
const qrcodeDialogVisible = ref(false)
const currentPatientId = ref<number | null>(null)

// 人脸录入对话框
const faceEnrollDialogVisible = ref(false)
const currentPatient = ref<any>(null)
const selectedFile = ref<File | null>(null)
const previewImage = ref<string>('')
const faceEnrolling = ref(false)
const uploadRef = ref<any>(null)

// 编辑对话框中的人脸上传
const faceUploadRef = ref<any>(null)
const facePreview = ref<string>('')
const faceFile = ref<File | null>(null)
const editHasFace = ref(false) // 编辑时是否已有脸

// 批量操作
const selectedRows = ref<any[]>([])

const filters = reactive({ keyword: '', gender: '', face_status: '' })
const pagination = reactive({ page: 1, per_page: 20, total: 0 })

const formData = reactive({
  patient_no: '', name: '', gender: 'male', age: undefined as number | undefined,
  phone: '', blood_type: '', medical_history: '', allergy_history: '',
})

const formRules = {
  patient_no: [{ required: true, message: '请输入患者编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
}

function defaultForm() {
  return { patient_no: '', name: '', gender: 'male', age: undefined, phone: '', blood_type: '', medical_history: '', allergy_history: '' }
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = { page: pagination.page, per_page: pagination.per_page }
    if (filters.keyword) params.keyword = filters.keyword
    if (filters.gender) params.gender = filters.gender
    const res: any = await getPatientsApi(params)
    tableData.value = res.data.items
    pagination.total = res.data.total
  } catch { /* handled */ } finally { loading.value = false }
}

function search() { pagination.page = 1; fetchData() }
function resetFilters() { filters.keyword = ''; filters.gender = ''; filters.face_status = ''; search() }

// 计算已录入人脸的患者数量
const faceEnrolledCount = computed(() => {
  return tableData.value.filter(p => p.has_face).length
})

// 批量删除
async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的患者')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 位患者吗？此操作不可恢复！`,
      '批量删除确认',
      { type: 'warning' }
    )

    loading.value = true
    const deletePromises = selectedRows.value.map(row => deletePatientApi(row.id))
    await Promise.all(deletePromises)

    ElMessage.success(`成功删除 ${selectedRows.value.length} 位患者`)
    selectedRows.value = []
    fetchData()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  } finally {
    loading.value = false
  }
}

// 导出数据
function handleExport() {
  if (tableData.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }

  // CSV 表头
  const headers = ['患者编号', '姓名', '性别', '年龄', '电话', '血型', '既往病史', '过敏史', '创建时间']

  // CSV 数据
  const rows = tableData.value.map(p => [
    p.patient_no,
    p.name,
    p.gender === 'male' ? '男' : p.gender === 'female' ? '女' : '未知',
    p.age || '-',
    p.phone || '-',
    p.blood_type || '-',
    p.medical_history || '-',
    p.allergy_history || '-',
    p.created_at
  ])

  // 生成 CSV 内容
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  // 下载文件
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `患者列表_${new Date().toLocaleDateString()}.csv`
  link.click()
  URL.revokeObjectURL(link.href)

  ElMessage.success('导出成功')
}

// 表格选择变化
function handleSelectionChange(selection: any[]) {
  selectedRows.value = selection
}

function openDialog(mode: 'create' | 'edit', row?: any) {
  dialogMode.value = mode
  editId.value = row?.id || null

  // 重置人脸相关状态
  faceFile.value = null
  facePreview.value = ''
  editHasFace.value = false

  if (mode === 'edit' && row) {
    Object.assign(formData, {
      patient_no: row.patient_no,
      name: row.name,
      gender: row.gender || 'male',
      age: row.age,
      phone: row.phone || '',
      blood_type: row.blood_type || '',
      medical_history: row.medical_history || '',
      allergy_history: row.allergy_history || '',
    })
    // 如果已有脸，设置标志并显示预览
    if (row.has_face && row.face_image_path) {
      editHasFace.value = true
      facePreview.value = `/static/${row.face_image_path}`
    }
  } else {
    Object.assign(formData, defaultForm())
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
  } catch { return }
  submitting.value = true
  try {
    let submitData: any = { ...formData }

    // 如果选择了人脸照片，使用FormData
    if (faceFile.value) {
      const formDataObj = new FormData()
      // 添加所有字段
      Object.keys(formData).forEach(key => {
        const value = (formData as any)[key]
        if (value !== undefined && value !== null && value !== '') {
          formDataObj.append(key, value)
        }
      })
      // 添加人脸照片
      formDataObj.append('face_image', faceFile.value)
      submitData = formDataObj
    }

    if (dialogMode.value === 'create') {
      await createPatientApi(submitData)
      ElMessage.success('患者创建成功')
    } else {
      await updatePatientApi(editId.value!, submitData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch { /* handled */ } finally { submitting.value = false }
}

async function handleDelete(row: any) {
  try {
    await deletePatientApi(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch { /* handled */ }
}

// ========== 编辑对话框中的人脸上传 ==========
function handleFaceFileChange(file: any) {
  const rawFile = file.raw

  // 验证文件大小（5MB）
  if (rawFile.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return
  }

  // 验证文件类型
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(rawFile.type)) {
    ElMessage.error('只支持 JPG/PNG 格式')
    return
  }

  faceFile.value = rawFile

  // 生成预览
  const reader = new FileReader()
  reader.onload = (e) => {
    facePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(rawFile)
}

function clearFacePreview() {
  faceFile.value = null
  facePreview.value = ''
  if (faceUploadRef.value) {
    faceUploadRef.value.clearFiles()
  }
}

function openQrcodeDialog(row: any) {
  currentPatientId.value = row.id
  qrcodeDialogVisible.value = true
}

// ========== 人脸录入功能 ==========
function openFaceEnrollDialog(row: any) {
  currentPatient.value = row
  selectedFile.value = null
  previewImage.value = ''
  faceEnrollDialogVisible.value = true
}

function handleFileChange(file: any) {
  const rawFile = file.raw

  // 验证文件大小（5MB）
  if (rawFile.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 5MB')
    return
  }

  // 验证文件类型
  if (!['image/jpeg', 'image/png', 'image/jpg'].includes(rawFile.type)) {
    ElMessage.error('只支持 JPG/PNG 格式')
    return
  }

  selectedFile.value = rawFile

  // 生成预览
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target?.result as string
  }
  reader.readAsDataURL(rawFile)
}

function clearPreview() {
  selectedFile.value = null
  previewImage.value = ''
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

async function handleFaceEnroll() {
  if (!selectedFile.value || !currentPatient.value) {
    ElMessage.warning('请先选择照片')
    return
  }

  // 调试信息
  console.log('人脸录入 - 患者信息:', currentPatient.value)
  console.log('人脸录入 - 患者编号:', currentPatient.value.patient_no)
  console.log('人脸录入 - 文件名:', selectedFile.value.name)
  console.log('人脸录入 - 文件大小:', selectedFile.value.size, 'bytes')

  faceEnrolling.value = true
  try {
    await enrollFaceApi(currentPatient.value.patient_no, selectedFile.value)
    ElMessage.success('人脸录入成功！')
    faceEnrollDialogVisible.value = false

    // 刷新列表
    fetchData()
  } catch (err: any) {
    console.error('人脸录入失败:', err)
    console.error('错误响应:', err.response?.data)
    ElMessage.error(err.response?.data?.message || '人脸录入失败，请重试')
  } finally {
    faceEnrolling.value = false
  }
}

onMounted(() => fetchData())
</script>

<style scoped lang="scss">
.patients-page {

  // 统计卡片
  .stats-bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .stat-item {
      background: var(--card-bg);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        flex-shrink: 0;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-secondary);
        }
      }
    }
  }

  // 筛选栏 - 单行紧凑布局
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--glass-border);
    flex-wrap: wrap;

    :deep(.el-input__wrapper) {
      height: 36px !important;
      padding: 0 12px !important;
    }

    :deep(.el-select .el-select__wrapper) {
      height: 36px !important;
      min-height: 36px !important;
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;

      :deep(.el-button) {
        height: 36px !important;
        padding: 0 14px !important;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      :deep(.el-divider--vertical) {
        height: 24px;
        margin: 0 4px;
      }
    }
  }

  // 性别徽标
  .gender-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 3px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    min-width: 40px;

    &.male {
      background: rgba(59, 130, 246, 0.15);
      color: #60A5FA;
    }

    &.female {
      background: rgba(244, 114, 182, 0.15);
      color: #F472B6;
    }
  }

  .pagination-wrap {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }

  // 表格
  :deep(.el-table__cell) {
    display: table-cell !important;
    vertical-align: middle !important;
  }

  :deep(.el-table__row) {
    td {
      .cell {
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
    }
  }

  :deep(.el-table__body tr td) {
    .cell {
      &:has(.gender-badge) {
        justify-content: center;
      }
    }
  }
}
</style>

<style lang="scss">
.action-link {
  background: transparent !important;
  padding: 2px 6px !important;

  &:hover {
    background: transparent !important;
    opacity: 0.8;
  }
}

/* 人脸录入对话框样式 */
.face-enroll-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.patient-info-box {
  :deep(.el-descriptions__label) {
    font-weight: 600;
  }
}

.upload-section {
  .face-uploader {
    width: 100%;

    :deep(.el-upload-dragger) {
      width: 100%;
      padding: 40px 20px;
      border: 2px dashed #dcdfe6;
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        border-color: #409EFF;
      }
    }
  }
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-text {
  text-align: center;
}

.upload-title {
  font-size: 16px;
  color: #303133;
  margin: 8px 0 4px;
  font-weight: 500;
}

.upload-hint {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.preview-container {
  position: relative;
  width: 100%;
  max-height: 400px;
  overflow: hidden;
  border-radius: 8px;
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
  display: flex;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;

  .preview-container:hover & {
    opacity: 1;
  }
}

.enroll-tips {
  ul {
    margin: 8px 0 0;
    padding-left: 20px;

    li {
      margin: 4px 0;
      font-size: 13px;
      line-height: 1.6;
    }
  }
}

/* 编辑对话框中的人脸上传区域 */
.face-upload-section {
  .face-upload-area {
    width: 150px;
    height: 150px;
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #409EFF;
    }
  }

  .face-preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .face-upload-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #f5f7fa;
  }

  .upload-text {
    font-size: 13px;
    color: #606266;
    margin: 0;
    text-align: center;
  }

  .upload-hint {
    font-size: 11px;
    color: #909399;
    margin: 0;
    text-align: center;
  }

  .face-actions {
    margin-top: 8px;
    display: flex;
    justify-content: center;
  }
}
</style>
