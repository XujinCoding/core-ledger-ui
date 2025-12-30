/**
 * 商品SKU管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type { ProductSkuVO, SkuPriceUpdateDTO } from '@/types/product'
import type { BigDecimal } from '@/types/common'

/**
 * 修改SKU价格
 * @param id SKU ID
 * @param price 新价格
 * @returns 修改后的SKU
 */
export const updateSkuPrice = (id: number, price: BigDecimal) => {
  return request.put<ProductSkuVO>(`/skus/${id}/price`, { price })
}

/**
 * 批量定价SKU
 * @param data 批量定价请求
 * @returns 定价成功数量
 */
export const batchUpdatePrice = (data: SkuPriceUpdateDTO) => {
  return request.put<number>('/skus/batch-price', data)
}

/**
 * 按名称模糊查询已定价SKU
 * @param name SKU名称
 * @returns 已定价SKU列表
 */
export const searchPricedSkusByName = (name: string) => {
  return request.get<ProductSkuVO[]>('/skus/search/priced', { name })
}

/**
 * 获取商品的所有SKU列表
 * @param productId 商品ID
 * @returns SKU列表
 */
export const getProductSkus = (productId: number) => {
  return request.get<ProductSkuVO[]>(`/products/${productId}/skus`)
}
