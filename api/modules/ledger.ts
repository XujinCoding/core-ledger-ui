/**
 * 账本管理 API
 * @author Core Ledger Team
 * @since 1.0.0
 */

import request from '@/utils/request'
import type { PageQueryResult } from '@/types/common'
import type {
  CreateLedgerDTO,
  UpdateLedgerItemsDTO,
  RecordLedgerDTO,
  SettleLedgerDTO,
  AddPaymentRecordDTO,
  CloseLedgerDTO,
  UpdateLedgerMemoDTO,
  LedgerQueryDTO,
  LedgerSearchDTO,
  LedgerVO,
  LedgerListVO
} from '@/types/ledger'

/**
 * 新增账单
 * @param data 创建请求
 * @returns 创建的账单
 */
export const createLedger = (data: CreateLedgerDTO) => {
  return request.post<LedgerVO>('/ledgers', data)
}

/**
 * 批量更新明细
 * @param id 账单ID
 * @param data 更新请求
 * @returns 更新后的账单
 */
export const updateLedgerItems = (id: number, data: UpdateLedgerItemsDTO) => {
  return request.put<LedgerVO>(`/ledgers/${id}/items`, data)
}

/**
 * 记账
 * @param id 账单ID
 * @param data 记账请求
 * @returns 更新后的账单
 */
export const recordLedger = (id: number, data: RecordLedgerDTO) => {
  return request.post<LedgerVO>(`/ledgers/${id}/record`, data)
}

/**
 * 结账
 * @param id 账单ID
 * @param data 结账请求
 * @returns 更新后的账单
 */
export const settleLedger = (id: number, data: SettleLedgerDTO) => {
  return request.post<LedgerVO>(`/ledgers/${id}/settle`, data)
}

/**
 * 新增支付记录
 * @param id 账单ID
 * @param data 支付记录请求
 * @returns 更新后的账单
 */
export const addPaymentRecord = (id: number, data: AddPaymentRecordDTO) => {
  return request.post<LedgerVO>(`/ledgers/${id}/payment-records`, data)
}

/**
 * 修改账单备注
 * @param id 账单ID
 * @param data 修改备注请求
 * @returns 更新后的账单
 */
export const updateLedgerMemo = (id: number, data: UpdateLedgerMemoDTO) => {
  return request.patch<LedgerVO>(`/ledgers/${id}/memo`, data)
}

/**
 * 关闭账单
 * @param id 账单ID
 * @param data 关闭请求
 * @returns 关闭结果
 */
export const closeLedger = (id: number, data: CloseLedgerDTO) => {
  return request.post<string>(`/ledgers/${id}/close`, data)
}

/**
 * 根据客户查询账单列表
 * @param query 查询条件
 * @param page 分页参数
 * @returns 分页账单列表
 */
export const queryLedgersByCustomer = (
  query?: LedgerQueryDTO,
  page?: {
    page?: number
    size?: number
    sort?: string
  }
) => {
  return request.get<{
    content: LedgerListVO[]
    totalElements: number
    totalPages: number
    currentPage: number
    pageSize: number
  }>('/ledgers', {
    ...query,
    ...page
  })
}

/**
 * 查询进行中的账单
 * @param page 分页参数
 * @returns 分页账单列表
 */
export const queryInProgressLedgers = (page?: {
  page?: number
  size?: number
  sort?: string
}) => {
  return request.get<{
    content: LedgerListVO[]
    totalElements: number
    totalPages: number
    currentPage: number
    pageSize: number
  }>('/ledgers/in-progress', page)
}

/**
 * 查询账单详情
 * @param id 账单ID
 * @returns 账单详情
 */
export const getLedgerDetail = (id: number) => {
  return request.get<LedgerVO>(`/ledgers/${id}`)
}

/**
 * 搜索账单列表（支持客户姓名和电话模糊查询）
 * @param params 搜索条件
 * @returns 分页账单列表
 */
export const searchLedgers = (params: LedgerSearchDTO) => {
  return request.get<PageQueryResult<LedgerListVO>>('/ledgers/search', params)
}
