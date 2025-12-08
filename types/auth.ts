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
  openid: string
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
}

/**
 * 客户微信注册请求
 */
export interface CustomerRegisterDTO {
  /** 微信OpenID */
  openid: string
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
 * 用户信息VO
 */
export interface UserInfoVO {
  /** 用户ID */
  id: number
  /** 用户名 */
  username: string
  /** 手机号 */
  phone: string
  /** 商户ID */
  merchantId?: number
  /** 商户名称 */
  merchantName?: string
  /** 商户编号 */
  merchantNo?: string
  /** 客户ID */
  customerId?: number
  /** 客户名称 */
  customerName?: string
  /** 客户编号 */
  customerNo?: string
  /** 客户手机号 */
  customerPhone?: string
  /** 身份类型 */
  identityType?: IdentityType
}

/**
 * 登录响应VO
 */
export interface LoginVO {
  /** 访问令牌 */
  token: string
  /** 用户信息 */
  userInfo: UserInfoVO
  /** 过期时间（毫秒） */
  expireTime: number
  /** 是否需要选择身份 */
  needIdentity?: boolean
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
  merchantName: string
  /** 商户编号 */
  merchantNo: string
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
