/** 诊断API */
import http from './index'

export const diagnoseSingleApi = (formData: FormData, signal?: AbortSignal) =>
  http.post('/diagnose/single', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
    signal // ✅ 支持中断信号
  })

export const getDiagnosisApi = (id: number) =>
  http.get(`/diagnose/${id}`)

export const getDiagnosisListApi = (params?: any) =>
  http.get('/diagnose/list', { params })

export const deleteDiagnosisApi = (id: number) =>
  http.delete(`/diagnose/${id}`)

/** 获取统一打印数据 */
export const getPrintDataApi = (diagnosisId: number) =>
  http.get(`/diagnose/${diagnosisId}/print`)
