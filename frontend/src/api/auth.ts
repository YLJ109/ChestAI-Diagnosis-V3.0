/** 认证API */
import http from './index'

export const loginApi = (data: { username: string; password: string }) =>
  http.post('/auth/login', data)

export const patientLoginApi = (data: { patient_no: string; login_method?: string }) =>
  http.post('/auth/patient-login', data)

export const registerApi = (data: any) =>
  http.post('/auth/register', data)

export const getCurrentUserApi = () =>
  http.get('/auth/me')

export const changePasswordApi = (data: { old_password: string; new_password: string }) =>
  http.post('/auth/change-password', data)

export const logoutApi = () =>
  http.post('/auth/logout')

export const getProfileApi = () =>
  http.get('/auth/profile')

export const updateProfileApi = (data: any) =>
  http.put('/auth/profile', data)

export const getPatientQrcodeApi = (patientId: number) =>
  http.get(`/auth/patient-qrcode/${patientId}`)

export const patientQrcodeLoginApi = (patientNo: string) =>
  http.post('/auth/patient-login', { patient_no: patientNo, login_method: 'qrcode' })

// 患者自助注册
export const patientRegisterApi = (data: {
  name: string
  gender: string
  age?: number
  phone?: string
  patient_no: string
}) =>
  http.post('/auth/patient-register', data)
