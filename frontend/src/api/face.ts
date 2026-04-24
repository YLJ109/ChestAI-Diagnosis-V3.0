/** 人脸识别 API */
import http from './index'

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
    // 直接使用 axios，绕过 token 拦截器
    return import('axios').then(({ default: axios }) => {
        return axios.post('/api/v1/face/recognize', {
            face_descriptor: faceDescriptor,
        })
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
