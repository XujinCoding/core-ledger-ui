/**
 * 通用类型定义
 * @author Core Ledger Team
 * @since 1.0.0
 */

/**
 * BigDecimal 类型（后端返回的大数字）
 * 在 TypeScript 中使用 string 或 number 表示
 */
export type BigDecimal = string | number

/**
 * 分页响应
 */
export interface PageResponse<T> {
  /** 内容列表 */
  content: T[]
  /** 总元素数 */
  totalElements: number
  /** 总页数 */
  totalPages: number
  /** 当前页码 */
  currentPage: number
  /** 每页大小 */
  pageSize: number
}

/**
 * API 响应包装
 */
export interface ApiResponse<T> {
  /** 响应码 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: T
}

/**
 * MyBatis PageHelper 分页响应
 */
export interface PageQueryResult<T> {
  /** 内容列表 */
  content: T[]
  /** 总页数 */
  totalPages: number | null
  /** 总元素数 */
  totalElements: number | null
}
