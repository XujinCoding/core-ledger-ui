<script setup lang="ts">
/**
 * 创建账单页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted } from 'vue'
import { searchCustomers } from '@/api/modules/customer'
import { listProducts } from '@/api/modules/product'
import { createLedger } from '@/api/modules/ledger'
import type { CustomerVO } from '@/types/customer'
import type { ProductVO } from '@/types/product'

// ==================== 数据状态 ====================

const step = ref(1) // 1-选择客户 2-选择商品 3-确认

// 客户相关
const customerKeyword = ref('')
const customers = ref<CustomerVO[]>([])
const selectedCustomer = ref<CustomerVO | null>(null)
const loadingCustomers = ref(false)

// 商品相关
const productKeyword = ref('')
const products = ref<ProductVO[]>([])
const loadingProducts = ref(false)

// 购物车
interface CartItem {
  product: ProductVO
  quantity: number
  price: number
}
const cartItems = ref<CartItem[]>([])

// 备注
const remark = ref('')

// 提交
const submitting = ref(false)

// ==================== 计算属性 ====================

const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const totalCount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

const canSubmit = computed(() => {
  return selectedCustomer.value && cartItems.value.length > 0
})

// ==================== 方法 ====================

/**
 * 搜索客户
 */
const searchCustomerList = async () => {
  try {
    loadingCustomers.value = true
    const res = await searchCustomers(
      { keyword: customerKeyword.value || undefined },
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
  loadProductList()
}

/**
 * 加载商品列表
 */
const loadProductList = async () => {
  try {
    loadingProducts.value = true
    const res = await listProducts(
      { keyword: productKeyword.value || undefined },
      { page: 0, size: 50 }
    )
    products.value = res.content || []
  } catch (error) {
    console.error('加载商品失败:', error)
  } finally {
    loadingProducts.value = false
  }
}

/**
 * 添加商品到购物车
 */
const addToCart = (product: ProductVO) => {
  const existing = cartItems.value.find(item => item.product.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    cartItems.value.push({
      product,
      quantity: 1,
      price: product.minPrice || 0
    })
  }
}

/**
 * 修改数量
 */
const updateQuantity = (index: number, delta: number) => {
  const item = cartItems.value[index]
  const newQty = item.quantity + delta
  if (newQty <= 0) {
    cartItems.value.splice(index, 1)
  } else {
    item.quantity = newQty
  }
}

/**
 * 移除商品
 */
const removeItem = (index: number) => {
  cartItems.value.splice(index, 1)
}

/**
 * 获取商品在购物车中的数量
 */
const getCartQuantity = (productId: number) => {
  const item = cartItems.value.find(i => i.product.id === productId)
  return item?.quantity || 0
}

/**
 * 去确认
 */
const goConfirm = () => {
  if (cartItems.value.length === 0) {
    uni.showToast({ title: '请选择商品', icon: 'none' })
    return
  }
  step.value = 3
}

/**
 * 提交订单
 */
const submit = async () => {
  if (!canSubmit.value) return

  try {
    submitting.value = true
    await createLedger({
      customerId: selectedCustomer.value!.id,
      remark: remark.value || undefined,
      items: cartItems.value.map(item => ({
        productId: item.product.id,
        skuId: item.product.defaultSkuId,
        quantity: item.quantity,
        price: item.price
      }))
    })
    uni.showToast({ title: '创建成功', icon: 'success' })
    setTimeout(() => {
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

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  // 如果传入了客户ID，直接跳到商品选择
  if (query.customerId) {
    // TODO: 根据ID加载客户信息
    step.value = 2
    loadProductList()
  } else {
    searchCustomerList()
  }
})
</script>

<template>
  <view class="ledger-add-page">
    <!-- 步骤条 -->
    <view class="step-bar">
      <view class="step-item" :class="{ active: step >= 1, done: step > 1 }">
        <view class="step-num">{{ step > 1 ? '✓' : '1' }}</view>
        <text class="step-text">选择客户</text>
      </view>
      <view class="step-line" :class="{ active: step > 1 }"></view>
      <view class="step-item" :class="{ active: step >= 2, done: step > 2 }">
        <view class="step-num">{{ step > 2 ? '✓' : '2' }}</view>
        <text class="step-text">选择商品</text>
      </view>
      <view class="step-line" :class="{ active: step > 2 }"></view>
      <view class="step-item" :class="{ active: step >= 3 }">
        <view class="step-num">3</view>
        <text class="step-text">确认提交</text>
      </view>
    </view>

    <!-- 步骤1：选择客户 -->
    <view v-if="step === 1" class="step-content">
      <view class="search-bar">
        <view class="search-input-wrap">
          <wd-icon name="search" size="36rpx" color="#999" />
          <input
            class="search-input"
            v-model="customerKeyword"
            placeholder="搜索客户姓名/手机号"
            @confirm="searchCustomerList"
          />
        </view>
      </view>

      <scroll-view class="customer-list" scroll-y>
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
      </scroll-view>
    </view>

    <!-- 步骤2：选择商品 -->
    <view v-if="step === 2" class="step-content">
      <!-- 已选客户 -->
      <view class="selected-customer" v-if="selectedCustomer">
        <view class="customer-avatar small">{{ selectedCustomer.name?.charAt(0) }}</view>
        <view class="customer-name">{{ selectedCustomer.name }}</view>
        <text class="change-btn" @tap="step = 1">更换</text>
      </view>

      <view class="search-bar">
        <view class="search-input-wrap">
          <wd-icon name="search" size="36rpx" color="#999" />
          <input
            class="search-input"
            v-model="productKeyword"
            placeholder="搜索商品名称"
            @confirm="loadProductList"
          />
        </view>
      </view>

      <scroll-view class="product-list" scroll-y>
        <view v-if="loadingProducts" class="loading-state">
          <wd-loading size="40rpx" />
        </view>
        <view v-else-if="products.length === 0" class="empty-state">
          <text>暂无商品</text>
        </view>
        <view
          v-else
          v-for="product in products"
          :key="product.id"
          class="product-item"
        >
          <view class="product-img">
            <wd-icon name="goods" size="48rpx" color="#ccc" />
          </view>
          <view class="product-info">
            <view class="product-name">{{ product.name }}</view>
            <view class="product-price">¥{{ product.minPrice || '--' }}</view>
          </view>
          <view class="quantity-control">
            <view
              v-if="getCartQuantity(product.id) > 0"
              class="qty-btn minus"
              @tap="updateQuantity(cartItems.findIndex(i => i.product.id === product.id), -1)"
            >-</view>
            <text v-if="getCartQuantity(product.id) > 0" class="qty-num">
              {{ getCartQuantity(product.id) }}
            </text>
            <view class="qty-btn plus" @tap="addToCart(product)">+</view>
          </view>
        </view>
      </scroll-view>

      <!-- 底部购物栏 -->
      <view class="cart-bar">
        <view class="cart-info">
          <view class="cart-count">已选 {{ totalCount }} 件</view>
          <view class="cart-total">合计 <text>¥{{ totalAmount.toFixed(2) }}</text></view>
        </view>
        <button class="next-btn" :disabled="cartItems.length === 0" @tap="goConfirm">
          下一步
        </button>
      </view>
    </view>

    <!-- 步骤3：确认提交 -->
    <view v-if="step === 3" class="step-content">
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
        <view class="cart-list">
          <view v-for="(item, index) in cartItems" :key="item.product.id" class="cart-item">
            <view class="item-info">
              <view class="item-name">{{ item.product.name }}</view>
              <view class="item-price">¥{{ item.price.toFixed(2) }} x {{ item.quantity }}</view>
            </view>
            <view class="item-total">¥{{ (item.price * item.quantity).toFixed(2) }}</view>
            <wd-icon name="close" size="28rpx" color="#999" @click="removeItem(index)" />
          </view>
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

      <!-- 底部 -->
      <view class="submit-bar">
        <view class="total-info">
          <text class="total-label">合计</text>
          <text class="total-amount">¥{{ totalAmount.toFixed(2) }}</text>
        </view>
        <button class="submit-btn" :loading="submitting" :disabled="!canSubmit" @tap="submit">
          创建账单
        </button>
      </view>
    </view>

    <!-- 返回按钮 -->
    <view class="back-btn" @tap="goBack">
      <wd-icon name="arrow-left" size="40rpx" />
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

.step-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx 60rpx;
  background: #fff;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.step-num {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #e5e5e5;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 500;

  .step-item.active & {
    background: #3B82F6;
    color: #fff;
  }

  .step-item.done & {
    background: #10B981;
    color: #fff;
  }
}

.step-text {
  font-size: 24rpx;
  color: #999;

  .step-item.active & {
    color: #3B82F6;
  }
}

.step-line {
  width: 80rpx;
  height: 4rpx;
  background: #e5e5e5;
  margin: 0 16rpx;
  margin-bottom: 32rpx;

  &.active {
    background: #3B82F6;
  }
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
  gap: 16rpx;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
}

.customer-list,
.product-list {
  flex: 1;
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
}

.change-btn {
  font-size: 26rpx;
  color: #3B82F6;
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

.back-btn {
  position: fixed;
  left: 32rpx;
  top: 32rpx;
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  z-index: 100;
}
</style>
