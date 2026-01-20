/**
 * 游客模式数据 Composable
 * 提供游客模式下的示例数据
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { LedgerStatus, Gender, Status } from '@/enums'

/**
 * 游客客户数据接口
 */
export interface GuestCustomer {
  id: number
  customerNo: string
  name: string
  phone: string
  alias?: string
  gender?: Gender
  age?: number
  addressPath?: string
  addressDetail?: string
  remark?: string
  avatarUrl?: string
  isRegistered: boolean
  createInstant: string
  isDemo: true
}

/**
 * 游客账单数据接口
 */
export interface GuestLedger {
  id: number
  customerId: number
  customerName: string
  customerPhone?: string
  ledgerStatus: LedgerStatus
  totalAmount: string
  paidAmount: string
  pendingAmount: string
  memo?: string
  code: string
  createInstant: string
  updateInstant: string
  isDemo: true
}

/**
 * 游客商品数据接口
 */
export interface GuestProduct {
  id: number
  categoryId: number
  categoryName: string
  name: string
  imageUrl?: string
  description?: string
  price: string
  spec?: string
  unit: string
  location?: string
  status: Status
  memo?: string
  createTime: string
  isDemo: true
}

/**
 * 游客分类数据接口
 */
export interface GuestCategory {
  id: number
  parentId: number
  name: string
  level: number
  sortOrder: number
  status: Status
  iconUrl?: string
  createTime: string
  isDemo: true
}

/**
 * 游客数据集合接口
 */
export interface GuestData {
  customers: GuestCustomer[]
  ledgers: GuestLedger[]
  products: GuestProduct[]
  categories: GuestCategory[]
}

// 数据缓存
let cachedData: GuestData | null = null

/**
 * 生成示例客户数据
 */
const generateCustomers = (): GuestCustomer[] => {
  const now = new Date()
  const baseTime = now.getTime()

  return [
    {
      id: 10001,
      customerNo: 'DEMO-C001',
      name: '示例客户A',
      phone: '138****0001',
      alias: '张先生',
      gender: Gender.MALE,
      age: 35,
      addressPath: '广东省/深圳市/南山区',
      addressDetail: '科技园南区示例路1号',
      remark: '这是演示数据',
      avatarUrl: '',
      isRegistered: false,
      createInstant: new Date(baseTime - 30 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 10002,
      customerNo: 'DEMO-C002',
      name: '示例客户B',
      phone: '139****0002',
      alias: '李女士',
      gender: Gender.FEMALE,
      age: 28,
      addressPath: '广东省/深圳市/福田区',
      addressDetail: '中心区示例大道88号',
      remark: '演示客户数据',
      avatarUrl: '',
      isRegistered: false,
      createInstant: new Date(baseTime - 20 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 10003,
      customerNo: 'DEMO-C003',
      name: '示例客户C',
      phone: '136****0003',
      alias: '王总',
      gender: Gender.MALE,
      age: 42,
      addressPath: '广东省/深圳市/宝安区',
      addressDetail: '西乡街道示例工业园',
      remark: '示例数据仅供演示',
      avatarUrl: '',
      isRegistered: false,
      createInstant: new Date(baseTime - 15 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 10004,
      customerNo: 'DEMO-C004',
      name: '示例客户D',
      phone: '137****0004',
      alias: '陈经理',
      gender: Gender.FEMALE,
      age: 31,
      addressPath: '广东省/深圳市/龙华区',
      addressDetail: '民治街道示例商业中心',
      remark: '演示用户',
      avatarUrl: '',
      isRegistered: false,
      createInstant: new Date(baseTime - 10 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    }
  ]
}

/**
 * 生成示例账单数据
 */
const generateLedgers = (): GuestLedger[] => {
  const now = new Date()
  const baseTime = now.getTime()

  return [
    {
      id: 20001,
      customerId: 10001,
      customerName: '示例客户A',
      customerPhone: '138****0001',
      ledgerStatus: LedgerStatus.CLEARED,
      totalAmount: '580.00',
      paidAmount: '580.00',
      pendingAmount: '0.00',
      memo: '演示账单 - 已结清',
      code: 'DEMO-L-20001',
      createInstant: new Date(baseTime - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updateInstant: new Date(baseTime - 4 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 20002,
      customerId: 10002,
      customerName: '示例客户B',
      customerPhone: '139****0002',
      ledgerStatus: LedgerStatus.PARTIAL,
      totalAmount: '1200.00',
      paidAmount: '500.00',
      pendingAmount: '700.00',
      memo: '演示账单 - 部分缴费',
      code: 'DEMO-L-20002',
      createInstant: new Date(baseTime - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updateInstant: new Date(baseTime - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 20003,
      customerId: 10001,
      customerName: '示例客户A',
      customerPhone: '138****0001',
      ledgerStatus: LedgerStatus.ON_CREDIT,
      totalAmount: '350.00',
      paidAmount: '0.00',
      pendingAmount: '350.00',
      memo: '演示账单 - 赊账中',
      code: 'DEMO-L-20003',
      createInstant: new Date(baseTime - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updateInstant: new Date(baseTime - 2 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 20004,
      customerId: 10003,
      customerName: '示例客户C',
      customerPhone: '136****0003',
      ledgerStatus: LedgerStatus.IN_PROGRESS,
      totalAmount: '890.00',
      paidAmount: '0.00',
      pendingAmount: '890.00',
      memo: '演示账单 - 进行中',
      code: 'DEMO-L-20004',
      createInstant: new Date(baseTime - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updateInstant: new Date(baseTime - 1 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 20005,
      customerId: 10004,
      customerName: '示例客户D',
      customerPhone: '137****0004',
      ledgerStatus: LedgerStatus.CLEARED,
      totalAmount: '450.00',
      paidAmount: '450.00',
      pendingAmount: '0.00',
      memo: '演示账单 - 已结清',
      code: 'DEMO-L-20005',
      createInstant: new Date(baseTime - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updateInstant: new Date(baseTime - 6 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 20006,
      customerId: 10002,
      customerName: '示例客户B',
      customerPhone: '139****0002',
      ledgerStatus: LedgerStatus.ON_CREDIT,
      totalAmount: '680.00',
      paidAmount: '0.00',
      pendingAmount: '680.00',
      memo: '演示账单 - 赊账中',
      code: 'DEMO-L-20006',
      createInstant: new Date(baseTime - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updateInstant: new Date(baseTime - 4 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 20007,
      customerId: 10003,
      customerName: '示例客户C',
      customerPhone: '136****0003',
      ledgerStatus: LedgerStatus.PARTIAL,
      totalAmount: '1500.00',
      paidAmount: '800.00',
      pendingAmount: '700.00',
      memo: '演示账单 - 部分缴费',
      code: 'DEMO-L-20007',
      createInstant: new Date(baseTime - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updateInstant: new Date(baseTime - 5 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 20008,
      customerId: 10001,
      customerName: '示例客户A',
      customerPhone: '138****0001',
      ledgerStatus: LedgerStatus.CLEARED,
      totalAmount: '280.00',
      paidAmount: '280.00',
      pendingAmount: '0.00',
      memo: '演示账单 - 已结清',
      code: 'DEMO-L-20008',
      createInstant: new Date(baseTime - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updateInstant: new Date(baseTime - 9 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    }
  ]
}

/**
 * 生成示例分类数据
 */
const generateCategories = (): GuestCategory[] => {
  const now = new Date()
  const baseTime = now.getTime()

  return [
    {
      id: 30001,
      parentId: 0,
      name: '演示分类-建材',
      level: 1,
      sortOrder: 1,
      status: Status.ACTIVE,
      iconUrl: '',
      createTime: new Date(baseTime - 60 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 30002,
      parentId: 0,
      name: '演示分类-五金',
      level: 1,
      sortOrder: 2,
      status: Status.ACTIVE,
      iconUrl: '',
      createTime: new Date(baseTime - 60 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 30003,
      parentId: 0,
      name: '演示分类-工具',
      level: 1,
      sortOrder: 3,
      status: Status.ACTIVE,
      iconUrl: '',
      createTime: new Date(baseTime - 60 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    }
  ]
}

/**
 * 生成示例商品数据
 */
const generateProducts = (): GuestProduct[] => {
  const now = new Date()
  const baseTime = now.getTime()

  return [
    {
      id: 40001,
      categoryId: 30001,
      categoryName: '演示分类-建材',
      name: '演示商品-水泥',
      imageUrl: '',
      description: '这是演示商品数据',
      price: '25.00',
      spec: '50kg/袋',
      unit: '袋',
      location: '仓库A区',
      status: Status.ACTIVE,
      memo: '演示数据',
      createTime: new Date(baseTime - 50 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 40002,
      categoryId: 30001,
      categoryName: '演示分类-建材',
      name: '演示商品-砖块',
      imageUrl: '',
      description: '演示商品仅供参考',
      price: '0.80',
      spec: '标准砖',
      unit: '块',
      location: '仓库A区',
      status: Status.ACTIVE,
      memo: '示例数据',
      createTime: new Date(baseTime - 50 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 40003,
      categoryId: 30002,
      categoryName: '演示分类-五金',
      name: '演示商品-螺丝',
      imageUrl: '',
      description: '演示商品',
      price: '0.15',
      spec: 'M6*20',
      unit: '个',
      location: '仓库B区',
      status: Status.ACTIVE,
      memo: '演示数据',
      createTime: new Date(baseTime - 45 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 40004,
      categoryId: 30002,
      categoryName: '演示分类-五金',
      name: '演示商品-钉子',
      imageUrl: '',
      description: '示例商品数据',
      price: '0.10',
      spec: '50mm',
      unit: '个',
      location: '仓库B区',
      status: Status.ACTIVE,
      memo: '演示数据',
      createTime: new Date(baseTime - 45 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 40005,
      categoryId: 30003,
      categoryName: '演示分类-工具',
      name: '演示商品-锤子',
      imageUrl: '',
      description: '演示商品',
      price: '35.00',
      spec: '500g',
      unit: '把',
      location: '仓库C区',
      status: Status.ACTIVE,
      memo: '示例数据',
      createTime: new Date(baseTime - 40 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    },
    {
      id: 40006,
      categoryId: 30003,
      categoryName: '演示分类-工具',
      name: '演示商品-扳手',
      imageUrl: '',
      description: '演示商品数据',
      price: '28.00',
      spec: '10寸',
      unit: '把',
      location: '仓库C区',
      status: Status.ACTIVE,
      memo: '演示数据',
      createTime: new Date(baseTime - 40 * 24 * 60 * 60 * 1000).toISOString(),
      isDemo: true
    }
  ]
}

/**
 * 游客数据 Composable
 * 提供游客模式下的示例数据，包含数据缓存机制
 */
export const useGuestData = () => {
  /**
   * 获取游客数据
   * 使用缓存机制避免重复生成
   */
  const getGuestData = (): GuestData => {
    if (!cachedData) {
      cachedData = {
        customers: generateCustomers(),
        ledgers: generateLedgers(),
        categories: generateCategories(),
        products: generateProducts()
      }
    }
    return cachedData
  }

  /**
   * 清除缓存数据
   * 用于需要重新生成数据的场景
   */
  const clearCache = () => {
    cachedData = null
  }

  /**
   * 获取示例客户列表
   */
  const getCustomers = (): GuestCustomer[] => {
    return getGuestData().customers
  }

  /**
   * 获取示例账单列表
   */
  const getLedgers = (): GuestLedger[] => {
    return getGuestData().ledgers
  }

  /**
   * 获取示例商品列表
   */
  const getProducts = (): GuestProduct[] => {
    return getGuestData().products
  }

  /**
   * 获取示例分类列表
   */
  const getCategories = (): GuestCategory[] => {
    return getGuestData().categories
  }

  /**
   * 根据客户ID获取客户信息
   */
  const getCustomerById = (customerId: number): GuestCustomer | undefined => {
    return getCustomers().find(c => c.id === customerId)
  }

  /**
   * 根据客户ID获取该客户的账单列表
   */
  const getLedgersByCustomerId = (customerId: number): GuestLedger[] => {
    return getLedgers().filter(l => l.customerId === customerId)
  }

  /**
   * 根据分类ID获取商品列表
   */
  const getProductsByCategoryId = (categoryId: number): GuestProduct[] => {
    return getProducts().filter(p => p.categoryId === categoryId)
  }

  return {
    getGuestData,
    clearCache,
    getCustomers,
    getLedgers,
    getProducts,
    getCategories,
    getCustomerById,
    getLedgersByCustomerId,
    getProductsByCategoryId
  }
}
