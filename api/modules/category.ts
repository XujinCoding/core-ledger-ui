/**
 * 商品分类管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type { CategoryVO, CategoryTreeVO, CategoryCreateDTO, CategoryUpdateDTO } from '@/types/product'

/**
 * 创建商品分类
 * @param data 创建请求
 * @returns 创建的分类
 */
export const createCategory = (data: CategoryCreateDTO) => {
  return request.post<CategoryVO>('/categories', data)
}

/**
 * 修改商品分类
 * @param id 分类ID
 * @param data 修改请求
 * @returns 修改后的分类
 */
export const updateCategory = (id: number, data: CategoryUpdateDTO) => {
  return request.put<CategoryVO>(`/categories/${id}`, data)
}

/**
 * 删除商品分类
 * @param id 分类ID
 * @returns 删除结果
 */
export const deleteCategory = (id: number) => {
  return request.delete<string>(`/categories/${id}`)
}

/**
 * 获取分类详情
 * @param id 分类ID
 * @returns 分类详情
 */
export const getCategory = (id: number) => {
  return request.get<CategoryVO>(`/categories/${id}`)
}

/**
 * 获取分类树
 * @returns 分类树形结构
 */
export const getCategoryTree = () => {
  return request.get<CategoryTreeVO[]>('/categories/tree')
}
