/** 患者门户API */
import http from './index'

// 首页概览
export const getPatientDashboardApi = () =>
  http.get('/patient/dashboard')

// 诊断记录列表
export const getPatientDiagnosesApi = (params?: any) =>
  http.get('/patient/diagnoses', { params })

// 报告列表
export const getPatientReportsApi = () =>
  http.get('/patient/reports')

// 报告详情
export const getPatientReportDetailApi = (id: number) =>
  http.get(`/patient/report/${id}`)

// 分诊记录
export const getPatientTriageRecordsApi = () =>
  http.get('/patient/triage-records')
