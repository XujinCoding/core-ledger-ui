/**
 * 短信验证码 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'

/**
 * 短信场景枚举
 */
export enum SmsScene {
  /** 商户注册 */
  MERCHANT_REGISTER = 'MERCHANT_REGISTER',
  /** 客户注册 */
  CUSTOMER_REGISTER = 'CUSTOMER_REGISTER',
  /** 登录验证 */
  LOGIN = 'LOGIN',
  /** 重置密码 */
  RESET_PASSWORD = 'RESET_PASSWORD'
}

/**
 * 发送短信验证码请求
 */
export interface SendSmsDTO {
  /** 手机号 */
  phone: string
  /** 场景 */
  scene: SmsScene
}

/**
 * 验证短信验证码请求
 */
export interface VerifySmsDTO {
  /** 手机号 */
  phone: string
  /** 验证码 */
  code: string
  /** 场景 */
  scene: SmsScene
}

/**
 * 发送短信验证码
 * @param dto 发送请求参数
 */
export const sendSmsCode = (dto: SendSmsDTO) => {
  return request.post<void>('/sms/send', dto)
}

/**
 * 验证短信验证码
 * @param dto 验证请求参数
 */
export const verifySmsCode = (dto: VerifySmsDTO) => {
  return request.post<boolean>('/sms/verify', dto)
}
