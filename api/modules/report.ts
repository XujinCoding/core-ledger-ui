/**
 * 报表 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type {
  IncomeStatsVO,
  ProductSalesVO,
  CustomerRankingVO,
  DebtTrendVO,
  DebtByAddressVO,
  DebtByCustomerVO
} from '@/types/report'

/**
 * 获取收入统计
 * @param merchantId 商户ID
 * @param type 时间类型：year/month/day
 * @param date 日期参数
 * @returns 收入统计数据
 */
export const getIncomeStats = (merchantId: number, type: string, date: string) => {
  return request.get<IncomeStatsVO>(`/report/${merchantId}/income-stats`, { type, date })
}

/**
 * 获取商品销售统计
 * @param merchantId 商户ID
 * @param type 时间类型：year/month/day
 * @param date 日期参数
 * @returns 商品销售数据列表
 */
export const getProductSales = (merchantId: number, type: string, date: string) => {
  return request.get<ProductSalesVO[]>(`/report/${merchantId}/product-sales`, { type, date })
}

/**
 * 获取客户交易排行
 * @param merchantId 商户ID
 * @param limit 返回数量限制
 * @param date 日期参数
 * @returns 客户交易排行列表
 */
export const getCustomerRanking = (merchantId: number, limit: number, date: string) => {
  return request.get<CustomerRankingVO[]>(`/report/${merchantId}/customer-ranking`, { limit, date })
}

/**
 * 获取欠款趋势
 * @param merchantId 商户ID
 * @param type 时间类型：year/month/day
 * @param date 日期参数
 * @returns 欠款趋势数据
 */
export const getDebtTrend = (merchantId: number, type: string, date: string) => {
  return request.get<DebtTrendVO>(`/report/${merchantId}/debt-trend`, { type, date })
}

/**
 * 获取按地址欠款分布
 * @param merchantId 商户ID
 * @param date 日期参数
 * @returns 地址欠款分布列表
 */
export const getDebtByAddress = (merchantId: number, date: string) => {
  return request.get<DebtByAddressVO[]>(`/report/${merchantId}/debt-by-address`, { date })
}

/**
 * 获取按客户欠款排行
 * @param merchantId 商户ID
 * @param limit 返回数量限制
 * @param date 日期参数
 * @returns 客户欠款排行列表
 */
export const getDebtByCustomer = (merchantId: number, limit: number, date: string) => {
  return request.get<DebtByCustomerVO[]>(`/report/${merchantId}/debt-by-customer`, { limit, date })
}
