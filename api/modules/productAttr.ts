/**
 * 商品属性管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type { ProductAttrVO, ProductAttrBatchUpdateDTO } from '@/types/product'

/**
 * 批量更新商品属性（推荐）
 * @param id 商品ID
 * @param data 批量更新请求
 * @returns 更新后的属性列表
 */
export const batchUpdateAttrs = (id: number, data: ProductAttrBatchUpdateDTO) => {
  return request.put<ProductAttrVO[]>(`/product-attr/${id}/attrs/batch`, data)
}

/**
 * 获取商品所有属性及其值
 * @param id 商品ID
 * @returns 属性列表
 */
export const getProductAttrs = (id: number) => {
  return request.get<ProductAttrVO[]>(`/product-attr/${id}/attrs`)
}
