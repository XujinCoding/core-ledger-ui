/**
 * 报表模块类型定义
 * @author Core Ledger Team
 * @since 1.0.0
 */

/**
 * 收入明细项
 */
export interface IncomeDetailItem {
  /** 标签（如：1月、2月...） */
  label: string
  /** 金额 */
  amount: number
}

/**
 * 收入统计VO
 */
export interface IncomeStatsVO {
  /** 总收入 */
  totalIncome: number
  /** 订单数 */
  orderCount: number
  /** 客户数 */
  customerCount: number
  /** 最大金额（用于计算柱状图比例） */
  maxAmount: number
  /** 收入明细列表 */
  details: IncomeDetailItem[]
}

/**
 * 商品销售VO
 */
export interface ProductSalesVO {
  /** 商品ID */
  productId: number
  /** 商品名称 */
  productName: string
  /** 销售金额 */
  amount: number
  /** 销售数量 */
  quantity: number
  /** 占比百分比 */
  percentage: number
}

/**
 * 客户交易排行VO
 */
export interface CustomerRankingVO {
  /** 客户ID */
  customerId: number
  /** 客户名称 */
  customerName: string
  /** 交易总金额 */
  totalAmount: number
  /** 订单数 */
  orderCount: number
}

/**
 * 欠款趋势明细项
 */
export interface DebtTrendDetailItem {
  /** 标签（如：1月、2月...） */
  label: string
  /** 新增欠款 */
  newDebt: number
  /** 已还款金额 */
  paidAmount: number
  /** 累计欠款 */
  totalDebt: number
}

/**
 * 欠款趋势VO
 */
export interface DebtTrendVO {
  /** 当前总欠款 */
  totalDebt: number
  /** 欠款客户数 */
  debtCustomerCount: number
  /** 最大金额（用于计算柱状图比例） */
  maxAmount: number
  /** 趋势明细列表 */
  details: DebtTrendDetailItem[]
}

/**
 * 按地址欠款VO
 */
export interface DebtByAddressVO {
  /** 地址 */
  address: string
  /** 欠款金额 */
  amount: number
  /** 客户数 */
  customerCount: number
}

/**
 * 按客户欠款VO
 */
export interface DebtByCustomerVO {
  /** 客户ID */
  customerId: number
  /** 客户名称 */
  customerName: string
  /** 欠款金额 */
  amount: number
  /** 账单数 */
  ledgerCount: number
  /** 逾期天数 */
  overdueDays: number
}
