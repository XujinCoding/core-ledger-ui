/**
 * 商品管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type { ProductVO, ProductCreateDTO, ProductUpdateDTO } from '@/types/product'

/**
 * 创建商品
 * @param data 创建请求
 * @returns 创建的商品
 */
export const createProduct = (data: ProductCreateDTO) => {
  return request.post<ProductVO>('/products', data)
}

/**
 * 修改商品
 * @param id 商品ID
 * @param data 修改请求
 * @returns 修改后的商品
 */
export const updateProduct = (id: number, data: ProductUpdateDTO) => {
  return request.put<ProductVO>(`/products/${id}`, data)
}

/**
 * 删除商品
 * @param id 商品ID
 * @returns 删除结果
 */
export const deleteProduct = (id: number) => {
  return request.delete<string>(`/products/${id}`)
}

/**
 * 获取商品详情
 * @param id 商品ID
 * @returns 商品详情
 */
export const getProduct = (id: number) => {
  return request.get<ProductVO>(`/products/${id}`)
}

/**
 * 获取商品列表
 * @param query 查询条件
 * @param page 分页参数
 * @returns 分页商品列表
 */
export const listProducts = (
  query?: {
    categoryId?: number
    keyword?: string
  },
  page?: {
    page?: number
    size?: number
    sort?: string
  }
) => {
  return request.get<{
    content: ProductVO[]
    totalElements: number
    totalPages: number
    currentPage: number
    pageSize: number
  }>('/products', {
    ...query,
    ...page
  })
}
