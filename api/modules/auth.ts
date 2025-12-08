/**
 * 认证管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type {
  WechatLoginDTO,
  PasswordLoginDTO,
  MerchantRegisterDTO,
  CustomerRegisterDTO,
  BindMerchantDTO,
  SwitchIdentityDTO,
  LoginVO,
  UserInfoVO,
  UserIdentitiesVO
} from '@/types/auth'

/**
 * 微信小程序登录
 * @param dto 登录请求参数
 * @returns 登录响应
 */
export const wechatLogin = (dto: WechatLoginDTO) => {
  return request.post<LoginVO>('/auth/wechat-login', dto)
}

/**
 * 手机号密码登录
 * @param dto 登录请求参数
 * @returns 登录响应
 */
export const passwordLogin = (dto: PasswordLoginDTO) => {
  return request.post<LoginVO>('/auth/login', dto)
}

/**
 * 登出
 * @returns 登出结果
 */
export const logout = () => {
  return request.post<string>('/auth/logout')
}

/**
 * 获取当前用户信息
 * @returns 用户信息
 */
export const getCurrentUser = () => {
  return request.get<UserInfoVO>('/auth/current-user')
}

/**
 * 商户微信注册
 * @param dto 商户注册请求参数
 * @returns 登录响应
 */
export const merchantWechatRegister = (dto: MerchantRegisterDTO) => {
  return request.post<LoginVO>('/auth/merchant/wechat/register', dto)
}

/**
 * 客户微信注册
 * @param dto 客户注册请求参数
 * @returns 登录响应
 */
export const customerWechatRegister = (dto: CustomerRegisterDTO) => {
  return request.post<LoginVO>('/auth/customer/wechat/register', dto)
}

/**
 * 客户扫码绑定商户
 * @param dto 绑定商户请求参数
 * @returns 登录响应
 */
export const bindMerchant = (dto: BindMerchantDTO) => {
  return request.post<LoginVO>('/auth/customer/bind-merchant', dto)
}

/**
 * 切换身份
 * @param dto 切换身份请求参数
 * @returns 登录响应
 */
export const switchIdentity = (dto: SwitchIdentityDTO) => {
  return request.post<LoginVO>('/auth/switch-identity', dto)
}

/**
 * 获取用户的所有身份
 * @returns 用户身份列表
 */
export const getUserIdentities = () => {
  return request.get<UserIdentitiesVO>('/auth/identities')
}
