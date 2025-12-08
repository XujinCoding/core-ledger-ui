/**
 * 地址管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import  request  from '@/utils/request'
import type { AddressVO, AddressChainVO } from '@/types/address'

/**
 * 获取地址详情
 * @param id 地址ID
 * @returns 地址详情
 */
export const getAddress = (id: number) => {
  return request.get<AddressVO>(`/addresses/${id}`)
}

/**
 * 创建地址
 * @param data 地址创建请求
 * @returns 创建的地址
 */
export const createAddress = (data: {
  parentId?: number
  name: string
  level?: number
  code?: string
  pinyin?: string
  abbreviation?: string
}) => {
  return request.post<AddressVO>('/addresses', data)
}

/**
 * 查询地址列表
 * @param query 查询条件
 * @returns 地址列表
 */
export const listAddresses = (query?: {
  parentId?: number
  level?: number
}) => {
  return request.get<AddressVO[]>('/addresses', query)
}

/**
 * 根据父级ID查询子级地址
 * @param parentId 父级ID
 * @returns 子级地址列表
 */
export const listAddressesByParent = (parentId: number) => {
  return request.get<AddressVO[]>(`/addresses/children/${parentId}`)
}

/**
 * 根据地址ID查询地址链
 * @param addressId 地址ID
 * @returns 地址链信息
 */
export const getAddressChain = (addressId: number) => {
  return request.get<AddressChainVO>(`/addresses/chain/${addressId}`)
}
