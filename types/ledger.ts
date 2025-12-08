/**
 * 账本模块类型定义
 * @author Core Ledger Team
 * @since 1.0.0
 */

import type { LedgerStatus, PaymentMethod } from '@/enums'
import type { BigDecimal } from '@/types/common'

/**
 * 账单明细DTO
 */
export interface LedgerItemDTO {
  /** 明细ID（null表示新增） */
  id?: number
  /** 商品ID */
  productId: number
  /** 商品名称 */
  productName: string
  /** SKU ID */
  skuId?: number
  /** SKU名称 */
  skuName?: string
  /** 单价 */
  price: BigDecimal
  /** 数量 */
  quantity: number
  /** 小计金额 */
  amount: BigDecimal
}

/**
 * 创建账单请求
 */
export interface CreateLedgerDTO {
  /** 客户ID */
  customerId: number
  /** 账单明细列表 */
  items?: LedgerItemDTO[]
  /** 备注 */
  memo?: string
  /** 商户ID */
  merchantId: number
}

/**
 * 更新账单明细请求
 */
export interface UpdateLedgerItemsDTO {
  /** 新增/修改的明细列表 */
  items?: LedgerItemDTO[]
  /** 删除的明细ID列表 */
  deleteIds?: number[]
}

/**
 * 记账请求
 */
export interface RecordLedgerDTO {
  /** 支付金额 */
  paymentAmount: BigDecimal
  /** 支付方式 */
  paymentMethod?: PaymentMethod
  /** 备注 */
  memo?: string
}

/**
 * 结账请求
 */
export interface SettleLedgerDTO {
  /** 支付金额 */
  paymentAmount: BigDecimal
  /** 支付方式 */
  paymentMethod?: PaymentMethod
  /** 备注 */
  memo?: string
}

/**
 * 添加支付记录请求
 */
export interface AddPaymentRecordDTO {
  /** 支付金额 */
  paymentAmount: BigDecimal
  /** 支付方式 */
  paymentMethod?: PaymentMethod
  /** 备注 */
  memo?: string
}

/**
 * 关闭账单请求
 */
export interface CloseLedgerDTO {
  /** 关闭原因 */
  reason?: string
  /** 备注 */
  memo?: string
}

/**
 * 账单查询条件
 */
export interface LedgerQueryDTO {
  /** 客户ID */
  customerId?: number
  /** 账单状态 */
  ledgerStatus?: LedgerStatus
  /** 创建时间-开始 */
  createdAtStart?: string
  /** 创建时间-结束 */
  createdAtEnd?: string
}

/**
 * 账单明细VO
 */
export interface LedgerItemVO {
  /** 明细ID */
  id: number
  /** 商品ID */
  productId: number
  /** 商品名称 */
  productName: string
  /** SKU ID */
  skuId?: number
  /** SKU名称 */
  skuName?: string
  /** 单价 */
  price: BigDecimal
  /** 数量 */
  quantity: number
  /** 小计金额 */
  amount: BigDecimal
}

/**
 * 支付记录VO
 */
export interface PaymentRecordVO {
  /** 支付记录ID */
  id: number
  /** 支付金额 */
  paymentAmount: BigDecimal
  /** 支付方式 */
  paymentMethod: PaymentMethod
  /** 支付时间 */
  paymentTime: string
  /** 备注 */
  memo?: string
}

/**
 * 账单VO（详情）
 */
export interface LedgerVO {
  /** 账单ID */
  id: number
  /** 客户ID */
  customerId: number
  /** 客户名称 */
  customerName: string
  /** 商户ID */
  merchantId: number
  /** 商户名称 */
  merchantName: string
  /** 账单状态 */
  status: LedgerStatus
  /** 总金额 */
  totalAmount: BigDecimal
  /** 已支付金额 */
  paidAmount: BigDecimal
  /** 待支付金额 */
  pendingAmount: BigDecimal
  /** 优惠金额 */
  discountAmount: BigDecimal
  /** 账单明细列表 */
  items: LedgerItemVO[]
  /** 支付记录列表 */
  paymentRecords: PaymentRecordVO[]
  /** 备注 */
  memo?: string
  /** 创建时间 */
  createTime: string
  /** 更新时间 */
  updateTime: string
}

/**
 * 账单列表VO（简略）
 */
export interface LedgerListVO {
  /** 账单ID */
  id: number
  /** 客户ID */
  customerId: number
  /** 客户名称 */
  customerName: string
  /** 商户ID */
  merchantId: number
  /** 商户名称 */
  merchantName: string
  /** 账单状态 */
  status: LedgerStatus
  /** 总金额 */
  totalAmount: BigDecimal
  /** 已支付金额 */
  paidAmount: BigDecimal
  /** 待支付金额 */
  pendingAmount: BigDecimal
  /** 创建时间 */
  createTime: string
  /** 更新时间 */
  updateTime: string
}
