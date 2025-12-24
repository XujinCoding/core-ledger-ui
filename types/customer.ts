/**
 * 客户模块类型定义
 * @author Core Ledger Team
 * @since 1.0.0
 */

import type { Gender, CustomerType } from '@/enums'

/**
 * 客户VO
 */
export interface CustomerVO {
  /** 客户ID */
  id: number
  /** 客户编号 */
  customerNo: string
  /** 客户姓名 */
  name: string
  /** 手机号 */
  phone: string
  /** 别名/昵称 */
  alias?: string
  /** 性别 */
  gender?: Gender
  /** 年龄 */
  age?: number
  /** 客户类型 */
  customerType?: CustomerType
  /** 地址ID */
  addressId?: number
  /** 地址路径 (省/市/区) */
  addressPath?: string
  /** 详细地址 */
  addressDetail?: string
  /** 商户ID */
  merchantId?: number
  /** 商户名称 */
  merchantName?: string
  /** 商户编号 */
  merchantNo?: string
  /** 用户ID */
  userId?: number
  /** 是否已注册 */
  isRegistered?: boolean
  /** 创建时间 */
  createInstant?: string
  /** 更新时间 */
  modifyInstant?: string
}

/**
 * 客户查询条件
 */
export interface CustomerSearchDTO {
  /** 客户姓名 */
  name?: string
  /** 手机号 */
  phone?: string
  /** 地址ID */
  addressId?: number
}

/**
 * 客户更新请求
 */
export interface CustomerUpdateDTO {
  /** 客户姓名 */
  name?: string
  /** 手机号 */
  phone?: string
  /** 别名/昵称 */
  alias?: string
  /** 性别 */
  gender?: Gender
  /** 年龄 */
  age?: number
  /** 客户类型 */
  customerType?: CustomerType
  /** 地址ID */
  addressId?: number
  /** 详细地址 */
  addressDetail?: string
}

/**
 * 客户统计信息VO
 */
export interface CustomerStatsVO {
  /** 总消费金额 */
  totalAmount: number
  /** 订单数量 */
  orderCount: number
  /** 平均消费金额 */
  avgAmount: number
}

/**
 * 客户分页VO
 */
export interface CustomerPageVO {
  /** 内容列表 */
  content: CustomerVO[]
  /** 总元素数 */
  totalElements: number
  /** 总页数 */
  totalPages: number
  /** 当前页码 */
  number: number
  /** 每页大小 */
  size: number
}
