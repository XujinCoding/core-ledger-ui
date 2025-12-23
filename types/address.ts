/**
 * 地址模块类型定义
 * @author Core Ledger Team
 * @since 1.0.0
 */

import type { AddressLevel } from '@/enums'

/**
 * 地址VO
 */
export interface AddressVO {
  /** 地址ID */
  id: number
  /** 父级ID */
  parentId?: number
  /** 地址名称 */
  name: string
  /** 地址级别 */
  level: AddressLevel
  /** 地址代码 */
  code?: string
  /** 拼音 */
  pinyin?: string
  /** 简写 */
  abbreviation?: string
  /** 完整路径 */
  fullPath?: string
}

/**
 * 地址链VO（用于回显）
 */
export interface AddressChainVO {
  /** 地址ID数组 */
  addressIds: number[]
  /** 地址名称数组 */
  addressNames: string[]
  /** 地址级别数组 */
  addressLevels: number[]
  /** 完整路径 */
  fullPath: string
  /** 目标地址ID */
  targetAddressId: number
}
