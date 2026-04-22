<template>
  <div class="patient-qrcode-dialog">
    <el-dialog
      v-model="visible"
      title="患者专属二维码"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading" :size="40">
          <Loading />
        </el-icon>
        <p>正在生成二维码...</p>
      </div>

      <div v-else-if="qrcodeData" class="qrcode-content">
        <div class="patient-info">
          <div class="info-item">
            <span class="label">患者编号：</span>
            <span class="value">{{ qrcodeData.patient_no }}</span>
          </div>
          <div class="info-item">
            <span class="label">患者姓名：</span>
            <span class="value">{{ qrcodeData.patient_name }}</span>
          </div>
        </div>

        <div class="qrcode-image-container">
          <img :src="qrcodeData.qrcode_base64" alt="患者二维码" class="qrcode-image" />
          <p class="qrcode-hint">请使用患者终端扫码登录</p>
        </div>

        <div class="qrcode-usage">
          <el-icon><InfoFilled /></el-icon>
          <div class="usage-text">
            <p><strong>使用说明：</strong></p>
            <ul>
              <li>此二维码为患者专属登录凭证</li>
              <li>在患者终端点击"扫码登录"即可快速登录</li>
              <li>二维码包含患者编号信息，请妥善保管</li>
            </ul>
          </div>
        </div>
      </div>

      <div v-else class="error-container">
        <el-icon :size="40" color="#F56C6C">
          <CircleCloseFilled />
        </el-icon>
        <p>二维码生成失败</p>
      </div>

      <template #footer>
        <el-button @click="visible = false">关闭</el-button>
        <el-button v-if="qrcodeData" type="primary" @click="downloadQrcode">
          <el-icon><Download /></el-icon>
          下载二维码
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, InfoFilled, CircleCloseFilled, Download } from '@element-plus/icons-vue'
import { getPatientQrcodeApi } from '@/api/auth'

interface QrcodeData {
  patient_id: number
  patient_no: string
  patient_name: string
  qrcode_base64: string
  qrcode_content: string
}

const props = defineProps<{
  modelValue: boolean
  patientId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = ref(props.modelValue)
const loading = ref(false)
const qrcodeData = ref<QrcodeData | null>(null)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.patientId) {
    fetchQrcode()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

async function fetchQrcode() {
  if (!props.patientId) return
  
  loading.value = true
  qrcodeData.value = null
  
  try {
    const res: any = await getPatientQrcodeApi(props.patientId)
    qrcodeData.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取二维码失败')
  } finally {
    loading.value = false
  }
}

function downloadQrcode() {
  if (!qrcodeData.value) return
  
  const link = document.createElement('a')
  link.href = qrcodeData.value.qrcode_base64
  link.download = `患者二维码_${qrcodeData.value.patient_no}.png`
  link.click()
  
  ElMessage.success('二维码下载成功')
}
</script>

<style scoped lang="scss">
.loading-container,
.error-container {
  text-align: center;
  padding: 40px 20px;
  color: var(--text-secondary);

  p {
    margin-top: 16px;
    font-size: 14px;
  }
}

.qrcode-content {
  .patient-info {
    margin-bottom: 24px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--glass-border);

    .info-item {
      display: flex;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        color: var(--text-secondary);
        font-size: 14px;
        min-width: 80px;
      }

      .value {
        color: var(--text-primary);
        font-size: 14px;
        font-weight: 500;
      }
    }
  }

  .qrcode-image-container {
    text-align: center;
    margin-bottom: 24px;

    .qrcode-image {
      width: 280px;
      height: 280px;
      border-radius: var(--radius-md);
      border: 2px solid var(--glass-border);
      box-shadow: 0 4px 12px var(--shadow-sm);
    }

    .qrcode-hint {
      margin-top: 12px;
      color: var(--text-muted);
      font-size: 13px;
    }
  }

  .qrcode-usage {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: rgba(var(--primary-rgb), 0.08);
    border-radius: var(--radius-md);
    border-left: 3px solid var(--primary);

    .el-icon {
      color: var(--primary);
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .usage-text {
      flex: 1;
      color: var(--text-secondary);
      font-size: 13px;
      line-height: 1.6;

      p {
        margin: 0 0 8px 0;
        color: var(--text-primary);
      }

      ul {
        margin: 0;
        padding-left: 20px;

        li {
          margin-bottom: 4px;
        }
      }
    }
  }
}
</style>
