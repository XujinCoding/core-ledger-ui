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
  /** 签名图片（base64或临时文件路径） */
  signatureImage?: string
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
 * 修改账单备注请求
 */
export interface UpdateLedgerMemoDTO {
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
 * 账单搜索条件（支持客户姓名和电话模糊查询）
 */
export interface LedgerSearchDTO {
  /** 客户姓名（模糊查询） */
  customerName?: string
  /** 客户电话（模糊查询） */
  customerPhone?: string
  /** 账单状态 */
  ledgerStatus?: LedgerStatus
  /** 页码（从1开始） */
  pageNumber?: number
  /** 每页数量 */
  pageSize?: number
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
  /** 账本ID */
  ledgerId?: number
  /** 支付金额 */
  amount: BigDecimal
  /** 支付方式 */
  paymentMethod: PaymentMethod
  /** 支付方式描述 */
  paymentMethodDesc?: string
  /** 支付时间 */
  createInstant: string
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
  /** 客户电话 */
  customerPhone?: string
  /** 客户地址 */
  customerAddress?: string
  /** 商户ID */
  merchantId?: number
  /** 商户名称 */
  merchantName?: string
  /** 账单状态 */
  ledgerStatus: LedgerStatus
  /** 账单状态描述 */
  ledgerStatusDesc?: string
  /** 总金额 */
  totalAmount: BigDecimal
  /** 已支付金额 */
  paidAmount: BigDecimal
  /** 剩余欠款 */
  remainingAmount?: BigDecimal
  /** 优惠金额 */
  discountAmount: BigDecimal
  /** 账单明细列表 */
  items: LedgerItemVO[]
  /** 支付记录列表 */
  paymentRecords: PaymentRecordVO[]
  /** 备注 */
  memo?: string
  /** 账单编号 */
  code?: string
  /** 签名图片URL */
  signatureImageUrl?: string
  /** 创建时间 */
  createInstant: string
  /** 修改时间 */
  modifyInstant?: string
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
  ledgerStatus: LedgerStatus
  /** 总金额 */
  totalAmount: BigDecimal
  /** 已支付金额 */
  paidAmount: BigDecimal
  /** 待支付金额 */
  pendingAmount: BigDecimal
  /** 创建时间 */
  createInstant: string
  /** 更新时间 */
  updateInstant: string
}

/**
 * 账单列表统计VO
 */
export interface LedgerListStatsVO {
  /** 总金额 */
  totalAmount: BigDecimal
  /** 已收金额 */
  paidAmount: BigDecimal
  /** 待收金额 */
  pendingAmount: BigDecimal
  /** 账单数量 */
  ledgerCount: number
}
