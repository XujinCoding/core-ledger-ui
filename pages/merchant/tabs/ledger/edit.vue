<script setup lang="ts">
/**
 * 编辑账单页面 - 账单明细行编辑模式
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted } from 'vue'
import { getLedgerDetail, updateLedgerItems } from '@/api/modules/ledger'
import { searchPricedSkusByName } from '@/api/modules/sku'
import type { LedgerVO, LedgerItemDTO } from '@/types/ledger'
import type { ProductSkuVO } from '@/types/product'

// ==================== 数据状态 ====================

const ledgerId = ref<number>(0)
const loading = ref(true)
const submitting = ref(false)
const ledger = ref<LedgerVO | null>(null)

// 账单明细行
interface LineItem {
  id?: number       // 原有明细ID（编辑时需要）
  tempId: number    // 临时ID，用于列表key
  productId?: number // 商品ID
  skuId?: number    // 关联的SKU ID
  productName: string
  quantity: number
  price: number
  isNew?: boolean   // 是否新增
}
const lineItems = ref<LineItem[]>([])
const deleteIds = ref<number[]>([])
let lineIdCounter = 0

// SKU搜索相关
const activeLineIndex = ref<number>(-1)
const skuSearchResults = ref<ProductSkuVO[]>([])
const searchingSkus = ref(false)
let skuSearchTimer: ReturnType<typeof setTimeout> | null = null

// ==================== 计算属性 ====================

const totalAmount = computed(() => {
  return lineItems.value.reduce((sum: number, item: LineItem) => sum + (item.price || 0) * (item.quantity || 0), 0)
})

const totalCount = computed(() => {
  return lineItems.value.reduce((sum: number, item: LineItem) => sum + (item.quantity || 0), 0)
})

// ==================== 方法 ====================

/**
 * 加载账单详情
 */
const loadDetail = async () => {
  try {
    loading.value = true
    ledger.value = await getLedgerDetail(ledgerId.value)
    
    // 初始化编辑数据 - 将现有明细转为行编辑格式
    if (ledger.value && ledger.value.items?.length) {
      lineItems.value = ledger.value.items.map(item => ({
        id: item.id,
        tempId: ++lineIdCounter,
        productId: item.productId,
        skuId: item.skuId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price || 0,
        isNew: false
      }))
    } else {
      // 没有明细时添加一个空行
      addLineItem()
    }
  } catch (error) {
    console.error('加载账单详情失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 添加明细行
 */
const addLineItem = () => {
  lineItems.value.push({
    tempId: ++lineIdCounter,
    productName: '',
    quantity: 1,
    price: 0,
    isNew: true
  })
}

/**
 * 删除明细行
 */
const removeLineItem = (index: number) => {
  const item = lineItems.value[index]
  // 如果是已存在的明细，记录删除ID
  if (item?.id && !item.isNew) {
    deleteIds.value.push(item.id)
  }
  lineItems.value.splice(index, 1)
  // 如果删除的是当前激活行，关闭搜索结果
  if (activeLineIndex.value === index) {
    activeLineIndex.value = -1
    skuSearchResults.value = []
  }
}

/**
 * 计算单行金额
 */
const getLineAmount = (item: LineItem) => {
  return (item.price || 0) * (item.quantity || 0)
}

/**
 * 处理商品名称输入 - 触发SKU搜索
 */
const handleProductNameInput = (index: number, value: string) => {
  lineItems.value[index].productName = value
  activeLineIndex.value = index
  
  if (skuSearchTimer) {
    clearTimeout(skuSearchTimer)
  }
  
  if (!value.trim()) {
    skuSearchResults.value = []
    return
  }
  
  skuSearchTimer = setTimeout(() => {
    searchSkus(value.trim())
  }, 300)
}

/**
 * 搜索SKU
 */
const searchSkus = async (keyword: string) => {
  if (!keyword) return
  
  try {
    searchingSkus.value = true
    const results = await searchPricedSkusByName(keyword)
    skuSearchResults.value = results || []
  } catch (error) {
    console.error('搜索SKU失败:', error)
    skuSearchResults.value = []
  } finally {
    searchingSkus.value = false
  }
}

/**
 * 选择SKU - 填充商品名称和单价
 */
const selectSku = (sku: ProductSkuVO) => {
  if (activeLineIndex.value >= 0 && activeLineIndex.value < lineItems.value.length) {
    const item = lineItems.value[activeLineIndex.value]
    item.productId = sku.productId
    item.skuId = sku.id
    item.productName = sku.skuName
    item.price = Number(sku.price) || 0
  }
  activeLineIndex.value = -1
  skuSearchResults.value = []
}

/**
 * 关闭SKU搜索结果
 */
const closeSkuSearch = () => {
  activeLineIndex.value = -1
  skuSearchResults.value = []
}

/**
 * 提交修改
 */
const submit = async () => {
  try {
    submitting.value = true
    
    // 过滤有效的明细行（商品名称不为空）
    const validItems = lineItems.value.filter(item => item.productName.trim())
    
    const items: LedgerItemDTO[] = validItems.map(item => ({
      id: item.isNew ? undefined : item.id,
      productId: item.productId!,
      skuId: item.skuId,
      productName: item.productName,
      skuName: item.productName,
      quantity: item.quantity || 1,
      price: item.price || 0,
      amount: (item.price || 0) * (item.quantity || 1)
    }))
    
    await updateLedgerItems(ledgerId.value, {
      items,
      deleteIds: deleteIds.value.length > 0 ? deleteIds.value : undefined
    })
    
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存失败:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

/**
 * 返回
 */
const goBack = () => {
  uni.navigateBack()
}

// ==================== 生命周期 ====================

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  if (query.id) {
    ledgerId.value = Number(query.id)
    uni.setNavigationBarTitle({ title: '编辑账单' })
    loadDetail()
  } else {
    uni.showToast({ title: '账单ID不能为空', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})
</script>

<template>
  <view class="edit-page">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <wd-loading size="48rpx" />
      <text>加载中...</text>
    </view>

    <template v-else-if="ledger">
      <!-- 客户信息 -->
      <view class="customer-section">
        <view class="customer-row">
          <view class="customer-avatar">{{ ledger.customerName?.charAt(0) }}</view>
          <view class="customer-info">
            <view class="customer-name">{{ ledger.customerName }}</view>
            <view class="customer-phone">{{ ledger.customerPhone || '' }}</view>
          </view>
        </view>
      </view>

      <!-- 账单明细编辑区域 -->
      <scroll-view class="content-scroll" scroll-y @tap="closeSkuSearch">
        <view class="content-scroll-inner">
          <view class="ledger-section">
            <view class="section-header">
              <text class="section-title">账单明细</text>
              <text class="section-hint">输入商品名搜索</text>
            </view>
            
            <!-- 表头 -->
            <view class="line-table-header">
              <text class="col-name">商品名称</text>
              <text class="col-qty">数量</text>
              <text class="col-price">单价</text>
              <text class="col-amount">金额</text>
              <text class="col-action"></text>
            </view>
            
            <!-- 明细行列表 -->
            <view class="line-items">
              <view v-for="(item, index) in lineItems" :key="item.tempId" class="line-row-item">
                <!-- 商品名称输入（支持搜索） -->
                <view class="col-name" @tap.stop>
                  <input 
                    class="compact-input name-input" 
                    :value="item.productName"
                    @input="(e: any) => handleProductNameInput(index, e.detail.value)"
                    @focus="activeLineIndex = index"
                    placeholder="搜索商品"
                  />
                  <!-- SKU搜索结果下拉 -->
                  <view v-if="activeLineIndex === index && skuSearchResults.length > 0" class="sku-dropdown" @tap.stop>
                    <view v-if="searchingSkus" class="sku-loading">
                      <wd-loading size="24rpx" />
                    </view>
                    <view 
                      v-for="sku in skuSearchResults" 
                      :key="sku.id" 
                      class="sku-option"
                      @tap.stop="selectSku(sku)"
                    >
                      <text class="sku-name">{{ sku.skuName }}</text>
                      <text class="sku-price">¥{{ sku.price }}</text>
                    </view>
                  </view>
                </view>
                <!-- 数量 -->
                <view class="col-qty">
                  <input 
                    class="compact-input qty-input" 
                    type="number"
                    v-model.number="item.quantity" 
                    placeholder="1"
                  />
                </view>
                <!-- 单价 -->
                <view class="col-price">
                  <input 
                    class="compact-input price-input" 
                    type="digit"
                    v-model.number="item.price" 
                    placeholder="0"
                  />
                </view>
                <!-- 金额 -->
                <view class="col-amount">
                  <text class="amount-text">{{ getLineAmount(item).toFixed(2) }}</text>
                </view>
                <!-- 删除按钮 -->
                <view class="col-action">
                  <view v-if="lineItems.length > 1" class="delete-btn" @tap="removeLineItem(index)">
                    <wd-icon name="close" size="24rpx" color="#999" />
                  </view>
                </view>
              </view>
            </view>

            <!-- 添加明细按钮 -->
            <view class="add-line-btn" @tap="addLineItem">
              <wd-icon name="add" size="28rpx" color="#3B82F6" />
              <text>添加一行</text>
            </view>
          </view>

          <!-- 汇总区域 -->
          <view class="ledger-summary">
            <view class="summary-row">
              <text class="summary-label">商品数量</text>
              <text class="summary-value">{{ totalCount }} 件</text>
            </view>
            <view class="summary-row total">
              <text class="summary-label">合计金额</text>
              <text class="summary-value">¥{{ totalAmount.toFixed(2) }}</text>
            </view>
          </view>
          
          <!-- 底部占位 -->
          <view style="height: 160rpx;"></view>
        </view>
      </scroll-view>

      <!-- 底部操作栏 -->
      <view class="action-bar">
        <view class="total-info">
          <text class="total-label">共 {{ lineItems.length }} 项</text>
          <text class="total-amount">¥{{ totalAmount.toFixed(2) }}</text>
        </view>
        <button class="submit-btn" :loading="submitting" @tap="submit">
          保存修改
        </button>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.edit-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  color: #999;
}

.customer-section {
  background: #fff;
  margin: 24rpx 24rpx 0;
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
}

.customer-row {
  display: flex;
  align-items: center;
}

.customer-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  margin-right: 24rpx;
}

.customer-info {
  flex: 1;
}

.customer-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 4rpx;
}

.customer-phone {
  font-size: 26rpx;
  color: #999;
}

.content-scroll {
  flex: 1;
}

.content-scroll-inner {
  padding: 24rpx;
}

/* 账单明细编辑样式 - 紧凑表格布局 */
.ledger-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.section-hint {
  font-size: 22rpx;
  color: #999;
}

/* 表头样式 */
.line-table-header {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 2rpx solid #f0f0f0;
  font-size: 22rpx;
  color: #999;
}

.line-table-header .col-name { flex: 3; }
.line-table-header .col-qty { width: 100rpx; text-align: center; }
.line-table-header .col-price { width: 120rpx; text-align: center; }
.line-table-header .col-amount { width: 120rpx; text-align: right; }
.line-table-header .col-action { width: 50rpx; }

/* 明细行列表 */
.line-items {
  display: flex;
  flex-direction: column;
}

/* 单行样式 */
.line-row-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.line-row-item .col-name { flex: 3; position: relative; }
.line-row-item .col-qty { width: 100rpx; }
.line-row-item .col-price { width: 120rpx; }
.line-row-item .col-amount { width: 120rpx; text-align: right; }
.line-row-item .col-action { width: 50rpx; display: flex; justify-content: center; }

/* 紧凑输入框 */
.compact-input {
  height: 64rpx;
  background: #f8f9fa;
  border: none;
  border-radius: 8rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
  box-sizing: border-box;
}

.name-input { width: 100%; }
.qty-input, .price-input { width: 100%; text-align: center; }
.amount-text { font-size: 26rpx; color: #EF4444; font-weight: 500; }
.delete-btn { padding: 8rpx; }

/* SKU搜索下拉 */
.sku-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
  z-index: 100;
  max-height: 400rpx;
  overflow-y: auto;
}

.sku-loading { padding: 24rpx; text-align: center; }

.sku-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;
  &:last-child { border-bottom: none; }
  &:active { background: #f5f5f5; }
}

.sku-name { font-size: 26rpx; color: #333; flex: 1; }
.sku-price { font-size: 26rpx; color: #EF4444; margin-left: 16rpx; }

/* 添加行按钮 */
.add-line-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx;
  margin-top: 16rpx;
  background: rgba(59, 130, 246, 0.05);
  border: 2rpx dashed #3B82F6;
  border-radius: 12rpx;
  
  text {
    font-size: 26rpx;
    color: #3B82F6;
    font-weight: 500;
  }
}

.ledger-summary {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
}

.ledger-summary .summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;

  &.total {
    border-top: 2rpx solid #f0f0f0;
    margin-top: 8rpx;
    padding-top: 24rpx;
  }
}

.ledger-summary .summary-label {
  font-size: 28rpx;
  color: #666;
}

.ledger-summary .summary-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.ledger-summary .summary-row.total .summary-value {
  font-size: 36rpx;
  color: #EF4444;
  font-weight: 600;
}

.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.total-info {
  flex: 1;
}

.total-label {
  font-size: 26rpx;
  color: #666;
  display: block;
}

.total-amount {
  font-size: 40rpx;
  font-weight: 600;
  color: #EF4444;
}

.submit-btn {
  width: 240rpx;
  height: 88rpx;
  background: #3B82F6;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }
}
</style>
