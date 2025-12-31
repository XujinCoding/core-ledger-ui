/**
 * 商户管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type { CreateCustomerDTO, MerchantStatsVO, TodayStatsVO, MerchantOverviewVO, UpdateMerchantDTO, CreateMerchantDTO, MerchantVO } from '@/types/merchant'

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

/**
 * 获取商户本月统计
 * @param merchantId 商户ID
 * @returns 本月统计数据
 */
export const getMerchantStats = (merchantId: number) => {
  return request.get<MerchantStatsVO>(`/merchant/${merchantId}/stats`)
}

/**
 * 获取商户今日汇总
 * @param merchantId 商户ID
 * @returns 今日汇总数据
 */
export const getTodayStats = (merchantId: number) => {
  return request.get<TodayStatsVO>(`/merchant/${merchantId}/today-stats`)
}

/**
 * 获取商户概览统计（客户数、商品数、账单数）
 * @param merchantId 商户ID
 * @returns 概览统计数据
 */
export const getMerchantOverview = (merchantId: number) => {
  return request.get<MerchantOverviewVO>(`/merchant/${merchantId}/overview`)
}

/**
 * 更新商户信息
 * @param merchantId 商户ID
 * @param data 更新数据
 */
export const updateMerchantInfo = (merchantId: number, data: UpdateMerchantDTO) => {
  return request.put(`/merchant/${merchantId}`, data)
}

/**
 * 创建店铺
 * @param data 创建数据
 */
export const createMerchant = (data: CreateMerchantDTO) => {
  return request.post('/merchant/create', data)
}

/**
 * 获取商户详情
 * @param merchantId 商户ID
 * @returns 商户详情
 */
export const getMerchantDetail = (merchantId: number) => {
  return request.get<MerchantVO>(`/merchant/${merchantId}`)
}

