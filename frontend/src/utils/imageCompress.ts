/**
 * 图片压缩工具
 * 用于移动端上传前自动压缩图片,减少流量和加载时间
 */

export interface CompressOptions {
    maxWidth?: number      // 最大宽度
    maxHeight?: number     // 最大高度
    quality?: number       // 质量 (0-1)
    format?: 'image/jpeg' | 'image/png' | 'image/webp'
}

/**
 * 压缩图片
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的Blob
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<Blob> {
    const {
        maxWidth = 800,
        maxHeight = 800,
        quality = 0.7,
        format = 'image/jpeg',
    } = options

    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            const img = new Image()

            img.onload = () => {
                // 计算缩放比例
                let width = img.width
                let height = img.height

                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height)
                    width = Math.floor(width * ratio)
                    height = Math.floor(height * ratio)
                }

                // 创建Canvas
                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'))
                    return
                }

                // 绘制图片
                ctx.drawImage(img, 0, 0, width, height)

                // 导出为Blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            console.log(
                                `[图片压缩] ${file.name}: ${(file.size / 1024).toFixed(2)}KB → ${(blob.size / 1024).toFixed(2)}KB (${((1 - blob.size / file.size) * 100).toFixed(1)}% 压缩率)`
                            )
                            resolve(blob)
                        } else {
                            reject(new Error('Failed to compress image'))
                        }
                    },
                    format,
                    quality
                )
            }

            img.onerror = () => {
                reject(new Error('Failed to load image'))
            }

            img.src = e.target?.result as string
        }

        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }

        reader.readAsDataURL(file)
    })
}

/**
 * 批量压缩图片
 * @param files 图片文件数组
 * @param options 压缩选项
 * @returns 压缩后的Blob数组
 */
export async function compressImages(
    files: File[],
    options: CompressOptions = {}
): Promise<Blob[]> {
    const promises = files.map((file) => compressImage(file, options))
    return Promise.all(promises)
}

/**
 * 将Blob转换为File
 * @param blob Blob对象
 * @param filename 文件名
 * @returns File对象
 */
export function blobToFile(blob: Blob, filename: string): File {
    return new File([blob], filename, {
        type: blob.type,
        lastModified: Date.now(),
    })
}

/**
 * 检查文件大小是否超过限制
 * @param file 文件
 * @param maxSizeMB 最大大小(MB)
 * @returns 是否超限
 */
export function isFileSizeExceeded(file: File, maxSizeMB: number = 5): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    return file.size > maxSizeBytes
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的大小字符串
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}
