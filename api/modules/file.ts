/**
 * 文件上传 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'

/**
 * 文件上传响应
 */
export interface FileUploadResponse {
  /** 文件路径（objectKey），用于保存到数据库 */
  path: string
  /** 预览URL（预签名URL），用于前端立即显示 */
  url: string
}

/**
 * 上传图片到腾讯云COS
 * @param filePath 本地文件路径
 * @returns 文件上传响应（包含path和url）
 */
export const uploadImage = (filePath: string): Promise<FileUploadResponse> => {
  return request.upload<FileUploadResponse>('/file/upload/image', filePath, { name: 'file' })
}

/**
 * 选择并上传图片
 * @param count 最多选择图片数量，默认1
 * @returns 上传后的文件上传响应数组
 */
export const chooseAndUploadImage = (count = 1): Promise<FileUploadResponse[]> => {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        try {
          const results: FileUploadResponse[] = []
          for (const filePath of res.tempFilePaths) {
            const result = await uploadImage(filePath)
            results.push(result)
          }
          resolve(results)
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        if (err.errMsg?.includes('cancel')) {
          resolve([])
        } else {
          reject(new Error(err.errMsg || '选择图片失败'))
        }
      }
    })
  })
}