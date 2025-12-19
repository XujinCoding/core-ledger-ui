/**
 * 客户管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type { CustomerVO, CustomerSearchDTO, CustomerUpdateDTO } from '@/types/customer'

/**
 * 修改客户
 * @param id 客户ID
 * @param data 修改请求
 * @returns 修改后的客户信息
 */
export const updateCustomer = (id: number, data: CustomerUpdateDTO) => {
  return request.put<CustomerVO>(`/customers/${id}`, data)
}

/**
 * 获取客户详情
 * @param id 客户ID
 * @returns 客户详情
 */
export const getCustomer = (id: number) => {
  return request.get<CustomerVO>(`/customers/${id}`)
}

/**
 * 条件查询客户列表
 * @param query 查询条件
 * @param page 分页参数
 * @returns 分页客户列表
 */
export const searchCustomers = (
  query?: CustomerSearchDTO,
  page?: {
    page?: number
    size?: number
    sort?: string
  }
) => {
  const params: Record<string, any> = {
    ...(query || {}),
    ...(page || {})
  }
  Object.keys(params).forEach((k) => {
    const v = params[k]
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      delete params[k]
    }
  })
  return request.get<{
    content: CustomerVO[]
    totalElements: number
    totalPages: number
    currentPage: number
    pageSize: number
  }>('/customers', params)
}

/**
 * 删除客户
 * @param id 客户ID
 * @returns 删除结果
 */
export const deleteCustomer = (id: number) => {
  return request.delete<string>(`/customers/${id}`)
}
