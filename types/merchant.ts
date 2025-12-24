/**
 * 商户模块类型定义
 * @author Core Ledger Team
 * @since 1.0.0
 */

import type { Gender, CustomerType } from '@/enums'

/**
 * 创建客户请求
 */
export interface CreateCustomerDTO {
  /** 商户ID */
  merchantId: number
  /** 客户姓名 */
  name: string
  /** 客户别名 */
  alias?: string
  /** 手机号 */
  phone: string
  /** 地址ID（推荐使用） */
  addressId?: number
  /** 详细地址 */
  addressDetail?: string
  /** 详细地址 */
  address?: string
  /** 性别 */
  gender?: Gender
  /** 年龄 */
  age?: number
  /** 备注 */
  remark?: string
}

/**
 * 商户信息VO
 */
export interface MerchantVO {
  /** 商户ID */
  id: number
  /** 商户编号 */
  merchantNo: string
  /** 商户名称 */
  merchantName: string
  /** 商户所有者ID */
  ownerUserId: number
  /** 邀请码 */
  inviteCode: string
  /** 二维码URL */
  qrCodeUrl?: string
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

/**
 * 商户本月统计VO
 */
export interface MerchantStatsVO {
  /** 本月销售额 */
  monthlySales: number
  /** 待收款金额 */
  pendingAmount: number
  /** 本月订单数 */
  monthlyOrders: number
}

/**
 * 今日汇总统计VO
 */
export interface TodayStatsVO {
  /** 今日销售额 */
  sales: number
  /** 今日已收款 */
  payment: number
  /** 今日新增欠款 */
  debt: number
  /** 今日订单数 */
  orders: number
}

/**
 * 商户概览统计VO
 */
export interface MerchantOverviewVO {
  /** 客户数 */
  customerCount: number
  /** 商品数 */
  productCount: number
  /** 账单数 */
  ledgerCount: number
}

/**
 * 更新商户信息DTO
 */
export interface UpdateMerchantDTO {
  /** 商户名称 */
  name?: string
  /** 手机号 */
  phone?: string
  /** 地址ID */
  addressId?: number
  /** 详细地址 */
  addressDetail?: string
}

/**
 * 创建商户DTO
 */
export interface CreateMerchantDTO {
  /** 商户名称 */
  merchantName: string
  /** 手机号 */
  phone?: string
  /** 地址ID */
  addressId?: number
  /** 详细地址 */
  addressDetail?: string
}
