/** 人脸识别 API - 扩展医护人员接口 */
import http from './index'
import axios from 'axios'

// 创建不携带 Token 的 axios 实例（用于人脸识别登录）
const httpNoAuth = axios.create({
    baseURL: '/api/v1',
    timeout: 60000,
})

/**
 * 录入患者人脸（管理端）
 * @param patientNo 患者编号
 * @param imageFile 图片文件
 */
export function enrollFaceApi(patientNo: string, imageFile: File) {
    const formData = new FormData()
    formData.append('patient_no', patientNo)
    formData.append('image', imageFile)

    return http.post('/face/enroll', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 验证人脸（测试用）
 * @param imageFile 图片文件
 */
export function verifyFaceApi(imageFile: File) {
    const formData = new FormData()
    formData.append('image', imageFile)

    return http.post('/face/verify', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 人脸识别登录（患者端，无需 token）
 * @param faceDescriptor 人脸特征向量 (512 维)
 */
export function recognizeFaceApi(faceDescriptor: number[]) {
    return httpNoAuth.post('/face/recognize', {
        face_descriptor: faceDescriptor,
    }).then(res => res.data)
}

/**
 * 查询患者人脸录入状态
 * @param patientId 患者 ID
 */
export function getFaceStatusApi(patientId: number) {
    return http.get(`/face/status/${patientId}`)
}

/**
 * 删除患者人脸数据
 * @param patientId 患者 ID
 */
export function removeFaceApi(patientId: number) {
    return http.delete(`/face/remove/${patientId}`)
}

// ========== 医护人员人脸识别 API ==========

/**
 * 录入医护人员人脸（管理端）
 * @param userId 用户ID
 * @param imageFile 图片文件
 */
export function enrollStaffFaceApi(userId: number, imageFile: File) {
    const formData = new FormData()
    formData.append('user_id', userId.toString())
    formData.append('image', imageFile)

    return http.post('/face/enroll-staff', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 从图片提取人脸特征（不识别），用于医护人员刷脸登录
 * @param imageData base64 图片数据
 */
export function extractFaceFeatureApi(imageData: string) {
    return httpNoAuth.post('/face/extract-face-feature', {
        image_data: imageData,
    }).then(res => res.data)
}

/**
 * 医护人员人脸识别登录（无需 token）
 * @param faceDescriptor 人脸特征向量 (512 维)
 */
export function recognizeStaffFaceApi(faceDescriptor: number[]) {
    return httpNoAuth.post('/face/recognize-staff', {
        face_descriptor: faceDescriptor,
    }).then(res => res.data)
}

/**
 * 更新医护人员人脸
 * @param userId 用户ID
 * @param imageFile 图片文件
 */
export function updateStaffFaceApi(userId: number, imageFile: File) {
    const formData = new FormData()
    formData.append('image', imageFile)

    return http.put(`/face/update-staff/${userId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

/**
 * 删除医护人员人脸数据
 * @param userId 用户ID
 */
export function removeStaffFaceApi(userId: number) {
    return http.delete(`/face/remove-staff/${userId}`)
}

/**
 * 查询医护人员人脸录入状态
 * @param userId 用户ID
 */
export function getStaffFaceStatusApi(userId: number) {
    return http.get(`/face/status-staff/${userId}`)
}
