/**
 * 认证模块类型定义
 * @author Core Ledger Team
 * @since 1.0.0
 */

import type { Gender, IdentityType } from '@/enums'

/**
 * 微信小程序登录请求
 */
export interface WechatLoginDTO {
  /** 微信登录凭证code */
  code: string
  /** 身份类型 */
  identityType: IdentityType
}

/**
 * 手机号密码登录请求
 */
export interface PasswordLoginDTO {
  /** 手机号 */
  phone: string
  /** 密码 */
  password: string
}

/**
 * 商户微信注册请求
 */
export interface MerchantRegisterDTO {
  /** 微信OpenID */
  code: string
  /** 手机号 */
  phone: string
  /** 用户名 */
  username: string
  /** 密码 */
  password: string
  /** 商户名称 */
  merchantName: string
  /** 微信昵称 */
  nickname?: string
  /** 微信头像URL */
  avatarUrl?: string
  /** 地址ID */
  addressId?: number
  /** 详细地址 */
  addressDetail?: string
}

/**
 * 客户微信注册请求
 */
export interface CustomerRegisterDTO {
  /** 微信OpenID */
  code: string
  /** 手机号 */
  phone: string
  /** 微信昵称 */
  nickname?: string
  /** 微信头像URL */
  avatarUrl?: string
  /** 客户姓名 */
  customerName: string
  /** 别名/昵称 */
  alias?: string
  /** 性别 */
  gender?: Gender
  /** 年龄 */
  age?: number
  /** 地址ID */
  addressId: number
  /** 详细地址 */
  addressDetail?: string
  /** 商户邀请码*/
  inviteCode: string
}

/**
 * 客户扫码绑定商户请求
 */
export interface BindMerchantDTO {
  /** 商户邀请码 */
  inviteCode: string
}

/**
 * 切换身份请求
 */
export interface SwitchIdentityDTO {
  /** 身份类型 */
  identityType: IdentityType
  /** 商户ID */
  merchantId?: number
  /** 客户ID */
  customerId?: number
}

/**
 * 用户信息VO - 当前登录用户身份
 */
export interface UserInfoVO {
  /** 标识 (customer.id / merchant.id 根据身份确定) */
  id: number
  /** 用户ID */
  userId: number
  /** 名称 (customer.name / merchant.name 根据身份确定) */
  name: string
  /** 手机号 (customer.phone / merchant.phone 根据身份确定) */
  phone: string
  /** 编码 (customer.code / merchant.code 根据身份确定) */
  code: string
  /** 关联地址标识 (customer.addressId / merchant.addressId 根据身份确定) */
  addressId?: number
  /** 详细地址 (customer.addressDetail / merchant.addressDetail 根据身份确定) */
  addressDetail?: string
  /** 商户标识 (如果没有商户标识, 标识客户当前没有选择任何商户) */
  merchantId?: number
  /** 身份类型：MERCHANT_OWNER 或 CUSTOMER */
  identityType: IdentityType
}

/**
 * 登录响应VO
 */
export interface LoginVO {
  /** 访问令牌 */
  token?: string
  /** 用户信息 */
  userInfo: UserInfoVO
  /** 过期时间（毫秒） */
  expireTime?: number
  /** 是否需要注册 */
  needRegister?: boolean
  /** 是否需要选择身份（多商户/多客户场景，此时token为临时token） */
  needSelect?: boolean
  /** 注册类型 */
  registerType?: IdentityType
  /** 商户列表（多个商户时） */
  merchants?: MerchantIdentity[]
  /** 客户列表（多个客户时） */
  customers?: CustomerIdentity[]
  /** 提示消息 */
  message?: string
}

/**
 * 商户身份信息
 */
export interface MerchantIdentity {
  /** 商户ID */
  id: number
  /** 商户名称 */
  name: string
  /** 商户编号 */
  code: string
  /** 手机号 */
  phone?: string
  /** 邀请码 */
  inviteCode?: string
  /** 地址ID */
  addressId?: number
  /** 详细地址 */
  addressDetail?: string
  /** 状态 */
  status?: number
}

/**
 * 客户身份信息
 */
export interface CustomerIdentity {
  /** 客户ID */
  id: number
  /** 客户名称 */
  customerName: string
  /** 客户编号 */
  customerNo: string
  /** 商户ID */
  merchantId: number
  /** 商户名称 */
  merchantName: string
  /** 商户编号 */
  merchantNo: string
}

/**
 * 用户身份列表VO
 */
export interface UserIdentitiesVO {
  /** 商户身份列表 */
  merchants: MerchantIdentity[]
  /** 客户身份列表 */
  customers: CustomerIdentity[]
}
