/**
 * 文件上传 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'

/**
 * 上传图片到 GitHub 图床
 * @param filePath 本地文件路径
 * @returns 图片访问 URL
 */
export const uploadImage = (filePath: string): Promise<string> => {
  return request.upload<string>('/file/upload/image', filePath, { name: 'file' })
}

/**
 * 选择并上传图片
 * @param count 最多选择图片数量，默认1
 * @returns 上传后的图片 URL 数组
 */
export const chooseAndUploadImage = (count = 1): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        try {
          const urls: string[] = []
          for (const filePath of res.tempFilePaths) {
            const url = await uploadImage(filePath)
            urls.push(url)
          }
          resolve(urls)
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