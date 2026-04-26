/** 患者门户API */
import http from './index'
import { requestCache, generateCacheKey } from '@/utils/requestCache'

// 首页概览 (缓存1分钟)
export const getPatientDashboardApi = () => {
  const cacheKey = generateCacheKey('patient_dashboard')
  const cached = requestCache.get(cacheKey)
  if (cached) return Promise.resolve(cached)

  return http.get('/patient/dashboard').then((res: any) => {
    requestCache.set(cacheKey, res, 60 * 1000) // 1分钟
    return res
  })
}

// 诊断记录列表 (缓存2分钟)
export const getPatientDiagnosesApi = (params?: any) => {
  const cacheKey = generateCacheKey('patient_diagnoses', params)
  const cached = requestCache.get(cacheKey)
  if (cached) return Promise.resolve(cached)

  return http.get('/patient/diagnoses', { params }).then((res: any) => {
    requestCache.set(cacheKey, res, 2 * 60 * 1000) // 2分钟
    return res
  })
}

// 报告列表 (缓存3分钟)
export const getPatientReportsApi = () => {
  const cacheKey = generateCacheKey('patient_reports')
  const cached = requestCache.get(cacheKey)
  if (cached) return Promise.resolve(cached)

  return http.get('/patient/reports').then((res: any) => {
    requestCache.set(cacheKey, res, 3 * 60 * 1000) // 3分钟
    return res
  })
}

// 报告详情 (缓存5分钟)
export const getPatientReportDetailApi = (id: number) => {
  const cacheKey = generateCacheKey(`patient_report_${id}`)
  const cached = requestCache.get(cacheKey)
  if (cached) return Promise.resolve(cached)

  return http.get(`/patient/report/${id}`).then((res: any) => {
    requestCache.set(cacheKey, res, 5 * 60 * 1000) // 5分钟
    return res
  })
}

// 分诊记录 (缓存2分钟)
export const getPatientTriageRecordsApi = () => {
  const cacheKey = generateCacheKey('patient_triage')
  const cached = requestCache.get(cacheKey)
  if (cached) return Promise.resolve(cached)

  return http.get('/patient/triage-records').then((res: any) => {
    requestCache.set(cacheKey, res, 2 * 60 * 1000) // 2分钟
    return res
  })
}

// 患者注册
export const registerPatientApi = (data: any) => {
  return http.post('/patient/register', data)
}
