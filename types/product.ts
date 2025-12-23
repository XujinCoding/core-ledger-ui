/**
 * 商品模块类型定义
 * @author Core Ledger Team
 * @since 1.0.0
 */

import type { Status, PriceStatus } from '@/enums'
import type { BigDecimal } from '@/types/common'

/**
 * 商品创建请求
 */
export interface ProductCreateDTO {
  /** 分类ID */
  categoryId: number
  /** 商品名称 */
  name: string
  /** 商品主图URL */
  imageUrl?: string
  /** 商品描述 */
  description?: string
  /** 标准价格 */
  price: BigDecimal
  /** 规格型号 */
  spec?: string
  /** 单位 */
  unit: string
  /** 存放位置 */
  location?: string
  /** 备注 */
  memo?: string
}

/**
 * 商品修改请求
 */
export interface ProductUpdateDTO {
  /** 商品名称 */
  name: string
  /** 商品主图URL */
  imageUrl?: string
  /** 商品描述 */
  description?: string
  /** 标准价格 */
  price?: BigDecimal
  /** 规格型号 */
  spec?: string
  /** 单位 */
  unit?: string
  /** 存放位置 */
  location?: string
  /** 分类ID */
  categoryId?: number
  /** 备注 */
  memo?: string
}

/**
 * 商品属性值VO
 */
export interface ProductAttrValueVO {
  /** 属性值ID */
  id: number
  /** 属性值名称 */
  name: string
  /** 排序序号 */
  sortOrder: number
}

/**
 * 商品属性VO
 */
export interface ProductAttrVO {
  /** 属性ID */
  id: number
  /** 属性名称 */
  name: string
  /** 属性值列表 */
  values: ProductAttrValueVO[]
  /** 排序序号 */
  sortOrder: number
}

/**
 * SKU VO
 */
export interface ProductSkuVO {
  /** SKU ID */
  id: number
  /** SKU 名称 */
  name: string
  /** 属性组合（JSON字符串） */
  attrCombination?: string
  /** 价格 */
  price?: BigDecimal
  /** 定价状态 */
  priceStatus: PriceStatus
  /** 库存 */
  stock?: number
  /** 状态 */
  status: Status
}

/**
 * 商品VO
 */
export interface ProductVO {
  /** 商品ID */
  id: number
  /** 分类ID */
  categoryId: number
  /** 分类名称 */
  categoryName: string
  /** 商品名称 */
  name: string
  /** 商品主图URL */
  imageUrl?: string
  /** 商品描述 */
  description?: string
  /** 标准价格 */
  price: BigDecimal
  /** 规格型号 */
  spec?: string
  /** 单位 */
  unit: string
  /** 存放位置 */
  location?: string
  /** 商品属性列表 */
  attrs?: ProductAttrVO[]
  /** SKU列表 */
  skus?: ProductSkuVO[]
  /** 状态 */
  status: Status
  /** 备注 */
  memo?: string
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

/**
 * 商品分类创建请求
 */
export interface CategoryCreateDTO {
  /** 父分类ID（0表示顶级分类） */
  parentId: number
  /** 分类名称 */
  name: string
  /** 排序序号 */
  sortOrder?: number
  /** 分类图标URL */
  iconUrl?: string
  /** 备注 */
  memo?: string
}

/**
 * 商品分类修改请求
 */
export interface CategoryUpdateDTO {
  /** 分类名称 */
  name?: string
  /** 排序序号 */
  sortOrder?: number
  /** 分类图标URL */
  iconUrl?: string
  /** 备注 */
  memo?: string
}

/**
 * 商品分类VO
 */
export interface CategoryVO {
  /** 分类ID */
  id: number
  /** 父分类ID */
  parentId: number
  /** 分类名称 */
  name: string
  /** 层级 */
  level: number
  /** 排序序号 */
  sortOrder: number
  /** 状态 */
  status?: number
  /** 分类图标URL */
  iconUrl?: string
  /** 备注 */
  memo?: string
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

/**
 * 商品分类树VO
 */
export interface CategoryTreeVO extends CategoryVO {
  /** 子分类列表 */
  children?: CategoryTreeVO[]
}

/**
 * SKU 价格更新请求
 */
export interface SkuPriceUpdateDTO {
  /** SKU价格列表 */
  skuPrices: Array<{
    skuId: number
    price: BigDecimal
  }>
}

/**
 * 商品属性批量更新请求
 */
export interface ProductAttrBatchUpdateDTO {
  /** 属性列表 */
  attrs: Array<{
    id?: number
    name: string
    values: Array<{
      id?: number
      name: string
      sortOrder?: number
    }>
    sortOrder?: number
  }>
}
