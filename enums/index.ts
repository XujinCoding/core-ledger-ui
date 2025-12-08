/**
 * 枚举定义
 * @author Core Ledger Team
 * @since 1.0.0
 */

/**
 * 身份类型枚举
 */
export enum IdentityType {
  /** 商户所有者 */
  MERCHANT_OWNER = 1,
  /** 客户 */
  CUSTOMER = 2
}

/**
 * 性别枚举
 */
export enum Gender {
  /** 未知 */
  UNKNOWN = 0,
  /** 男 */
  MALE = 1,
  /** 女 */
  FEMALE = 2
}

/**
 * 状态枚举
 */
export enum Status {
  /** 无效/已删除 */
  INACTIVE = 0,
  /** 有效/启用 */
  ACTIVE = 1
}

/**
 * 账本状态枚举
 */
export enum LedgerStatus {
  /** 进行中 */
  IN_PROGRESS = 1,
  /** 部分缴费 */
  PARTIAL = 2,
  /** 已结清 */
  CLEARED = 3,
  /** 赊账中 */
  ON_CREDIT = 4,
  /** 已关闭 */
  CLOSED = 5
}

/**
 * 支付方式枚举
 */
export enum PaymentMethod {
  /** 现金 */
  CASH = 1,
  /** 微信 */
  WECHAT = 2,
  /** 支付宝 */
  ALIPAY = 3,
  /** 银行转账 */
  BANK_TRANSFER = 4
}

/**
 * 定价状态枚举
 */
export enum PriceStatus {
  /** 未定价 */
  UNPRICED = 0,
  /** 已定价 */
  PRICED = 1
}

/**
 * 客户类型枚举
 */
export enum CustomerType {
  /** 模板客户（未绑定商户） */
  TEMPLATE = 0,
  /** 正式客户（已绑定商户） */
  FORMAL = 1
}

/**
 * 地址级别枚举
 */
export enum AddressLevel {
  /** 省级 */
  PROVINCE = 1,
  /** 市级 */
  CITY = 2,
  /** 区县级 */
  DISTRICT = 3,
  /** 乡镇级 */
  TOWN = 4,
  /** 村级 */
  VILLAGE = 5
}

/**
 * 枚举辅助函数
 */

/**
 * 获取性别标签
 */
export const getGenderLabel = (value: Gender | number): string => {
  const labels: Record<number, string> = {
    0: '未知',
    1: '男',
    2: '女'
  }
  return labels[value as number] || '未知'
}

/**
 * 获取账本状态标签
 */
export const getLedgerStatusLabel = (value: LedgerStatus | number): string => {
  const labels: Record<number, string> = {
    1: '进行中',
    2: '部分缴费',
    3: '已结清',
    4: '赊账中',
    5: '已关闭'
  }
  return labels[value as number] || '未知'
}

/**
 * 获取支付方式标签
 */
export const getPaymentMethodLabel = (value: PaymentMethod | number): string => {
  const labels: Record<number, string> = {
    1: '现金',
    2: '微信',
    3: '支付宝',
    4: '银行转账'
  }
  return labels[value as number] || '未知'
}

/**
 * 获取定价状态标签
 */
export const getPriceStatusLabel = (value: PriceStatus | number): string => {
  const labels: Record<number, string> = {
    0: '未定价',
    1: '已定价'
  }
  return labels[value as number] || '未知'
}

/**
 * 获取客户类型标签
 */
export const getCustomerTypeLabel = (value: CustomerType | number): string => {
  const labels: Record<number, string> = {
    0: '模板客户',
    1: '正式客户'
  }
  return labels[value as number] || '未知'
}

/**
 * 获取地址级别标签
 */
export const getAddressLevelLabel = (value: AddressLevel | number): string => {
  const labels: Record<number, string> = {
    1: '省级',
    2: '市级',
    3: '区县级',
    4: '乡镇级',
    5: '村级'
  }
  return labels[value as number] || '未知'
}

/**
 * 获取状态标签
 */
export const getStatusLabel = (value: Status | number): string => {
  const labels: Record<number, string> = {
    0: '无效',
    1: '有效'
  }
  return labels[value as number] || '未知'
}

/**
 * 获取身份类型标签
 */
export const getIdentityTypeLabel = (value: IdentityType | string): string => {
  const labels: Record<string, string> = {
    MERCHANT_OWNER: '商户所有者',
    CUSTOMER: '客户'
  }
  return labels[value as string] || '未知'
}
