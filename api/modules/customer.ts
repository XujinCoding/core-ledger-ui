/**
 * 客户管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type { 
  CustomerVO, 
  CustomerSearchDTO, 
  CustomerUpdateDTO, 
  CustomerAddDTO, 
  CustomerPageVO,
  CustomerStatsVO
} from '@/types/customer'

/**
 * 添加客户
 * @param data 客户信息
 * @returns 添加后的客户信息
 */
export const addCustomer = (data: CustomerAddDTO) => {
  return request.post<CustomerVO>('/customers', data)
}

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
 * 获取客户统计信息
 * @param id 客户ID
 * @returns 客户统计信息
 */
export const getCustomerStats = (id: number) => {
  return request.get<CustomerStatsVO>(`/customers/${id}/stats`)
}

/**
 * 条件查询客户列表
 * @param query 查询条件
 * @param page 分页参数
 * @returns 分页客户列表
 */
export const searchCustomers = (
  query?: Omit<CustomerSearchDTO, 'page' | 'size'>,
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
  
  // 移除空值
  Object.keys(params).forEach((k) => {
    const v = params[k]
    if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
      delete params[k]
    }
  })
  
  return request.get<CustomerPageVO>('/customers', { params })
}

/**
 * 删除客户
 * @param id 客户ID
 * @returns 删除结果
 */
export const deleteCustomer = (id: number) => {
  return request.delete(`/customers/${id}`)
}

/**
 * 导出客户数据
 * @param query 查询条件
 * @returns 导出结果
 */
export const exportCustomers = (query?: CustomerSearchDTO) => {
  return request.get('/customers/export', { 
    params: query,
    responseType: 'blob'
  })
}
