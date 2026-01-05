<script setup lang="ts">
/**
 * 创建账单页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted, watch } from 'vue'
import { searchCustomers, getCustomer } from '@/api/modules/customer'
import { createLedger } from '@/api/modules/ledger'
import { searchPricedSkusByName } from '@/api/modules/sku'
import type { CustomerVO } from '@/types/customer'
import type { ProductSkuVO } from '@/types/product'

// ==================== 数据状态 ====================

const step = ref(1) // 1-选择客户 2-选择商品 3-确认

// 客户相关
const customerKeyword = ref('')
const customers = ref<CustomerVO[]>([])
const selectedCustomer = ref<CustomerVO | null>(null)
const loadingCustomers = ref(false)
// 搜索类型: name=姓名, phone=手机号
const searchType = ref<'name' | 'phone'>('name')
const showSearchTypePopup = ref(false)
const searchTypeOptions = [
  { name: '姓名', value: 'name' },
  { name: '手机号', value: 'phone' }
]

// 账单明细行
interface LedgerLineItem {
  id: number  // 临时ID，用于列表key
  productId?: number // 商品ID
  skuId?: number  // 关联的SKU ID
  productName: string
  quantity: number
  price: number
}
const lineItems = ref<LedgerLineItem[]>([])
let lineIdCounter = 0

// SKU搜索相关
const activeLineIndex = ref<number>(-1)  // 当前激活的行索引
const skuSearchResults = ref<ProductSkuVO[]>([])
const searchingSkus = ref(false)
let skuSearchTimer: ReturnType<typeof setTimeout> | null = null

// 备注
const remark = ref('')

// 提交
const submitting = ref(false)

// ==================== 计算属性 ====================

const totalAmount = computed(() => {
  return lineItems.value.reduce((sum: number, item: LedgerLineItem) => sum + (item.price || 0) * (item.quantity || 0), 0)
})

const totalCount = computed(() => {
  return lineItems.value.reduce((sum: number, item: LedgerLineItem) => sum + (item.quantity || 0), 0)
})

const canSubmit = computed(() => {
  return selectedCustomer.value !== null
})

// ==================== 方法 ====================

/**
 * 处理搜索类型选择
 * @param item - action-sheet 选中项，包含 name 和自定义 value 属性
 * @param index - 选中项索引
 */
const handleSearchTypeSelect = ({ item, index }: { item: { name: string; value: string }; index: number }) => {
  searchType.value = item.value as 'name' | 'phone'
  showSearchTypePopup.value = false
}

/**
 * 搜索客户
 */
const searchCustomerList = async () => {
  try {
    loadingCustomers.value = true
    const searchParams: { name?: string; phone?: string } = {}
    if (customerKeyword.value) {
      if (searchType.value === 'name') {
        searchParams.name = customerKeyword.value
      } else {
        searchParams.phone = customerKeyword.value
      }
    }
    const res = await searchCustomers(
      searchParams,
      { page: 0, size: 20 }
    )
    customers.value = res.content || []
  } catch (error) {
    console.error('搜索客户失败:', error)
  } finally {
    loadingCustomers.value = false
  }
}

/**
 * 选择客户
 */
const selectCustomer = (customer: CustomerVO) => {
  selectedCustomer.value = customer
  step.value = 2
  // 默认添加一行空白明细
  if (lineItems.value.length === 0) {
    addLineItem()
  }
}

/**
 * 添加明细行
 */
const addLineItem = () => {
  lineItems.value.push({
    id: ++lineIdCounter,
    productName: '',
    quantity: 1,
    price: 0
  })
}

/**
 * 删除明细行
 */
const removeLineItem = (index: number) => {
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
const getLineAmount = (item: LedgerLineItem) => {
  return (item.price || 0) * (item.quantity || 0)
}

/**
 * 处理商品名称输入 - 触发SKU搜索
 */
const handleProductNameInput = (index: number, value: string) => {
  lineItems.value[index].productName = value
  activeLineIndex.value = index
  
  // 清除之前的定时器
  if (skuSearchTimer) {
    clearTimeout(skuSearchTimer)
  }
  
  // 如果输入为空，清除搜索结果
  if (!value.trim()) {
    skuSearchResults.value = []
    return
  }
  
  // 防抖搜索
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
  // 关闭搜索结果
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
 * 去确认
 */
const goConfirm = () => {
  step.value = 3
}

/**
 * 提交订单
 */
const submit = async () => {
  if (!canSubmit.value) return

  try {
    submitting.value = true
    // 获取商户ID（从客户信息或当前登录的商户中获取）
    const merchantId = selectedCustomer.value!.merchantId
    if (!merchantId) {
      uni.showToast({ title: '商户信息缺失', icon: 'none' })
      return
    }
    
    // 过滤有效的明细行（商品名称不为空）
    const validItems = lineItems.value.filter(item => item.productName.trim())
    
    await createLedger({
      customerId: selectedCustomer.value!.id,
      merchantId: merchantId,
      memo: remark.value || undefined,
      items: validItems.length > 0 ? validItems.map(item => ({
        productId: item.productId!,
        skuId: item.skuId,
        productName: item.productName,
        skuName: item.productName,
        quantity: item.quantity || 1,
        price: item.price || 0,
        amount: (item.price || 0) * (item.quantity || 1)
      })) : undefined
    })
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => {
      // 触发账单变更事件，通知相关页面刷新
      uni.$emit('ledger-changed')
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('创建账单失败:', error)
  } finally {
    submitting.value = false
  }
}

/**
 * 返回上一步
 */
const goBack = () => {
  if (step.value > 1) {
    step.value--
  } else {
    uni.navigateBack()
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  // 如果传入了客户ID，加载客户信息并跳到明细编辑
  if (query.customerId) {
    try {
      const customer = await getCustomer(Number(query.customerId))
      selectedCustomer.value = customer
      step.value = 2
      addLineItem()
    } catch (error) {
      console.error('加载客户信息失败:', error)
      uni.showToast({ title: '加载客户信息失败', icon: 'none' })
      searchCustomerList()
    }
  } else {
    searchCustomerList()
  }
})
</script>

<template>
  <view class="ledger-add-page">
    <!-- 步骤条 -->
    <view class="steps-header">
      <wd-steps :active="step - 1" align-center>
        <wd-step title="选择客户" />
        <wd-step title="选择商品" />
        <wd-step title="确认提交" />
      </wd-steps>
    </view>

    <!-- 步骤1：选择客户 -->
    <view v-if="step === 1" class="step-content">
      <view class="search-bar">
        <view class="search-input-wrap">
          <!-- 搜索类型下拉选择 -->
          <view class="search-type-select" @tap="showSearchTypePopup = true">
            <text class="search-type-text">{{ searchType === 'name' ? '姓名' : '手机号' }}</text>
            <wd-icon name="arrow-down" size="24rpx" color="#666" />
          </view>
          <view class="search-divider"></view>
          <!-- 搜索输入框 -->
          <input
            class="search-input"
            v-model="customerKeyword"
            :placeholder="searchType === 'name' ? '请输入客户姓名' : '请输入手机号'"
            placeholder-class="placeholder"
            confirm-type="search"
            :type="searchType === 'phone' ? 'number' : 'text'"
            @confirm="searchCustomerList"
          />
          <wd-icon
            v-if="customerKeyword"
            name="close-fill"
            size="32rpx"
            color="#ccc"
            @tap="customerKeyword = ''; searchCustomerList()"
          />
          <wd-icon v-else name="search" size="36rpx" color="#999" />
        </view>
      </view>
      
      <!-- 搜索类型选择弹窗 -->
      <wd-action-sheet
        v-model="showSearchTypePopup"
        :actions="searchTypeOptions"
        @select="handleSearchTypeSelect"
        cancel-text="取消"
      />

      <scroll-view class="customer-list" scroll-y enable-flex>
        <view class="customer-list-inner">
          <view v-if="loadingCustomers" class="loading-state">
            <wd-loading size="40rpx" />
          </view>
          <view v-else-if="customers.length === 0" class="empty-state">
            <text>暂无客户</text>
          </view>
          <view
            v-else
            v-for="customer in customers"
            :key="customer.id"
            class="customer-item"
            @tap="selectCustomer(customer)"
          >
            <view class="customer-avatar">{{ customer.name?.charAt(0) }}</view>
            <view class="customer-info">
              <view class="customer-name">{{ customer.name }}</view>
              <view class="customer-phone">{{ customer.phone || '暂无电话' }}</view>
            </view>
            <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 步骤2：填写账单明细 -->
    <view v-if="step === 2" class="step-content">
      <!-- 已选客户 -->
      <view class="selected-customer" v-if="selectedCustomer">
        <view class="customer-avatar small">{{ selectedCustomer.name?.charAt(0) }}</view>
        <view class="customer-info">
          <view class="customer-name">{{ selectedCustomer.name }}</view>
          <view class="customer-phone">{{ selectedCustomer.phone || '' }}</view>
        </view>
        <view class="change-btn" @tap="step = 1">
          <wd-icon name="edit-outline" size="28rpx" />
          <text>更换</text>
        </view>
      </view>

      <!-- 账单明细编辑区域 -->
      <scroll-view class="ledger-detail-scroll" scroll-y @tap="closeSkuSearch">
        <view class="ledger-detail-inner">
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
              <view v-for="(item, index) in lineItems" :key="item.id" class="line-row-item">
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
        </view>
      </scroll-view>

      <!-- 底部操作栏 -->
      <view class="cart-bar">
        <view class="cart-info">
          <view class="cart-count">共 {{ lineItems.length }} 项</view>
          <view class="cart-total">合计 <text>¥{{ totalAmount.toFixed(2) }}</text></view>
        </view>
        <button class="next-btn" @tap="goConfirm">
          下一步
        </button>
      </view>
    </view>

    <!-- 步骤3：确认提交 -->
    <view v-if="step === 3" class="step-content step-confirm">
      <!-- 可滚动内容区域 -->
      <scroll-view class="confirm-scroll" scroll-y>
        <!-- 客户信息 -->
        <view class="confirm-section">
          <view class="section-title">客户信息</view>
          <view class="customer-row">
            <view class="customer-avatar">{{ selectedCustomer?.name?.charAt(0) }}</view>
            <view class="customer-info">
              <view class="customer-name">{{ selectedCustomer?.name }}</view>
              <view class="customer-phone">{{ selectedCustomer?.phone }}</view>
            </view>
          </view>
        </view>

        <!-- 商品清单 -->
        <view class="confirm-section">
          <view class="section-title">商品清单 ({{ totalCount }}件)</view>
          <view v-if="lineItems.filter(i => i.productName.trim()).length > 0" class="cart-list">
            <view v-for="item in lineItems.filter(i => i.productName.trim())" :key="item.id" class="cart-item">
              <view class="item-info">
                <view class="item-name">{{ item.productName }}</view>
                <view class="item-price">¥{{ (item.price || 0).toFixed(2) }} x {{ item.quantity || 1 }}</view>
              </view>
              <view class="item-total">¥{{ getLineAmount(item).toFixed(2) }}</view>
            </view>
          </view>
          <view v-else class="empty-cart-tip">
            <wd-icon name="goods" size="64rpx" color="#ccc" />
            <text>暂未填写商品，可后续添加</text>
          </view>
        </view>

        <!-- 备注 -->
        <view class="confirm-section">
          <view class="section-title">备注</view>
          <textarea
            class="remark-input"
            v-model="remark"
            placeholder="添加备注（选填）"
            :maxlength="200"
          />
        </view>
      </scroll-view>

      <!-- 固定底部栏 -->
      <view class="submit-bar-fixed">
        <view class="total-info">
          <text class="total-label">合计</text>
          <text class="total-amount">¥{{ totalAmount.toFixed(2) }}</text>
        </view>
        <button class="submit-btn" :loading="submitting" :disabled="!canSubmit" @tap="submit">
          创建账单
        </button>
      </view>
    </view>

  </view>
</template>

<style lang="scss" scoped>
.ledger-add-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.steps-header {
  flex-shrink: 0;
  background: #fff;
  padding: 20rpx 0;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-bar {
  padding: 20rpx 24rpx;
  background: #fff;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 16rpx 24rpx;
  gap: 12rpx;
}

.search-type-select {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding-right: 12rpx;
  flex-shrink: 0;
}

.search-type-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.search-divider {
  width: 2rpx;
  height: 32rpx;
  background: #ddd;
  flex-shrink: 0;
}

.placeholder {
  color: #999;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
}

.customer-list {
  flex: 1;
  height: 0;
}

.product-list {
  flex: 1;
}

.customer-list-inner,
.product-list-inner {
  padding: 24rpx;
}

.loading-state,
.empty-state {
  padding: 80rpx 0;
  text-align: center;
  color: #999;
}

.customer-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
}

.customer-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 600;
  margin-right: 24rpx;

  &.small {
    width: 64rpx;
    height: 64rpx;
    font-size: 28rpx;
    margin-right: 16rpx;
  }
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

.selected-customer {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: #EBF5FF;
  gap: 12rpx;
}

.change-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  font-size: 26rpx;
  color: #3B82F6;
  padding: 12rpx 20rpx;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 24rpx;
  margin-left: auto;
}

.product-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
}

.product-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.product-price {
  font-size: 32rpx;
  color: #EF4444;
  font-weight: 600;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.qty-btn {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: 500;

  &.minus {
    background: #f5f5f5;
    color: #666;
  }

  &.plus {
    background: #3B82F6;
    color: #fff;
  }
}

.qty-num {
  font-size: 32rpx;
  font-weight: 500;
  min-width: 48rpx;
  text-align: center;
}

.cart-bar {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.cart-info {
  flex: 1;
}

.cart-count {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.cart-total {
  font-size: 28rpx;
  color: #333;

  text {
    font-size: 40rpx;
    font-weight: 600;
    color: #EF4444;
  }
}

.next-btn {
  width: 240rpx;
  height: 88rpx;
  background: #3B82F6;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &[disabled] {
    background: #ccc;
  }

  &::after {
    border: none;
  }
}

.confirm-section {
  background: #fff;
  margin: 24rpx;
  border-radius: 24rpx;
  padding: 32rpx;

  &:first-child {
    margin-top: 0;
  }
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
}

.customer-row {
  display: flex;
  align-items: center;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.empty-cart-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48rpx 0;
  gap: 16rpx;
  
  text {
    font-size: 26rpx;
    color: #999;
  }
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.cart-item .item-info {
  flex: 1;
}

.cart-item .item-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.cart-item .item-price {
  font-size: 24rpx;
  color: #999;
}

.cart-item .item-total {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.remark-input {
  width: 100%;
  height: 160rpx;
  background: #f5f5f5;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.submit-bar {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.total-info {
  flex: 1;
}

.total-label {
  font-size: 28rpx;
  color: #666;
}

.total-amount {
  font-size: 44rpx;
  font-weight: 600;
  color: #EF4444;
}

.submit-btn {
  width: 280rpx;
  height: 96rpx;
  background: #3B82F6;
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &[disabled] {
    background: #ccc;
  }

  &::after {
    border: none;
  }
}

/* 确认提交步骤样式 */
.step-confirm {
  position: relative;
}

.confirm-scroll {
  flex: 1;
  padding-bottom: 160rpx;
}

.submit-bar-fixed {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

/* 账单明细编辑样式 - 紧凑表格布局 */
.ledger-detail-scroll {
  flex: 1;
}

.ledger-detail-inner {
  padding: 24rpx;
}

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

.line-row-item .col-name {
  flex: 3;
  position: relative;
}

.line-row-item .col-qty {
  width: 100rpx;
}

.line-row-item .col-price {
  width: 120rpx;
}

.line-row-item .col-amount {
  width: 120rpx;
  text-align: right;
}

.line-row-item .col-action {
  width: 50rpx;
  display: flex;
  justify-content: center;
}

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

.name-input {
  width: 100%;
}

.qty-input,
.price-input {
  width: 100%;
  text-align: center;
}

.amount-text {
  font-size: 26rpx;
  color: #EF4444;
  font-weight: 500;
}

.delete-btn {
  padding: 8rpx;
}

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

.sku-loading {
  padding: 24rpx;
  text-align: center;
}

.sku-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background: #f5f5f5;
  }
}

.sku-name {
  font-size: 26rpx;
  color: #333;
  flex: 1;
}

.sku-price {
  font-size: 26rpx;
  color: #EF4444;
  margin-left: 16rpx;
}

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

</style>
