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
  /** 省级地址 */
  province?: AddressVO
  /** 市级地址 */
  city?: AddressVO
  /** 区县级地址 */
  district?: AddressVO
  /** 乡镇级地址 */
  town?: AddressVO
  /** 村级地址 */
  village?: AddressVO
}
