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
  customerName: string
  /** 手机号 */
  phone: string
  /** 详细地址 */
  address?: string
  /** 性别 */
  gender?: Gender
  /** 年龄 */
  age?: number
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
