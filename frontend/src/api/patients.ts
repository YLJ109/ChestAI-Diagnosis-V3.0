/** 患者管理API */
import http from './index'

export const getPatientsApi = (params?: any) =>
  http.get('/patients/', { params })

export const getPatientApi = (id: number) =>
  http.get(`/patients/${id}`)

export const createPatientApi = (data: any) => {
  // 如果包含face_image字段，使用FormData
  if (data instanceof FormData || data.face_image) {
    return http.post('/patients/', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  return http.post('/patients/', data)
}

export const updatePatientApi = (id: number, data: any) => {
  // 如果包含face_image字段，使用FormData
  if (data instanceof FormData || data.face_image) {
    return http.put(`/patients/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
  return http.put(`/patients/${id}`, data)
}

export const deletePatientApi = (id: number) =>
  http.delete(`/patients/${id}`)
