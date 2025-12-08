/**
 * 商户管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type { CreateCustomerDTO } from '@/types/merchant'

/**
 * 创建客户
 * @param data 创建请求
 * @returns 创建的客户
 */
export const createCustomer = (data: CreateCustomerDTO) => {
  return request.post('/merchant/customer/create', data)
}

/**
 * 获取商户信息
 * @param merchantId 商户ID
 * @returns 商户信息
 */
export const getMerchant = (merchantId: number) => {
  return request.get(`/merchant/${merchantId}`)
}
