<script setup lang="ts">
/**
 * 商品定价页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted } from 'vue'
import { getProduct } from '@/api/modules/product'
import { batchUpdatePrice, getProductSkus } from '@/api/modules/sku'
import type { ProductVO, ProductSkuVO } from '@/types/product'

// ==================== 页面参数 ====================

const productId = ref<number>(0)

// ==================== 数据状态 ====================

const loading = ref(true)
const submitting = ref(false)
const product = ref<ProductVO | null>(null)

// SKU价格编辑
interface SkuPriceItem {
  id: number
  name: string
  price: string
  priceStatus: number  // 0=未定价, 1=已定价
}
const skuPrices = ref<SkuPriceItem[]>([])

// ==================== 计算属性 ====================

// 是否有SKU可以保存
const canSave = computed(() => {
  return skuPrices.value.length > 0
})

// ==================== 方法 ====================

/**
 * 加载商品详情
 */
const loadProduct = async () => {
  try {
    loading.value = true
    // 加载商品基本信息
    const res = await getProduct(productId.value)
    product.value = res
    
    // 加载商品SKU列表
    const skuList = await getProductSkus(productId.value)
    
    // 初始化SKU价格列表，未定价的排在前面
    if (skuList && skuList.length > 0) {
      skuPrices.value = skuList
        .map((sku: ProductSkuVO) => ({
          id: sku.id,
          name: sku.skuName,
          price: sku.price?.toString() || '',
          priceStatus: sku.priceStatus
        }))
        .sort((a: SkuPriceItem, b: SkuPriceItem) => a.priceStatus - b.priceStatus)  // 未定价(0)排前面
    } else {
      // 没有SKU时显示提示
      skuPrices.value = []
      uni.showToast({ title: '该商品暂无SKU，请先添加商品属性', icon: 'none', duration: 2000 })
    }
  } catch (error) {
    console.error('加载商品失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 统一定价
 */
const applyUniformPrice = () => {
  uni.showModal({
    title: '统一定价',
    editable: true,
    placeholderText: '请输入价格',
    success: (res) => {
      if (res.confirm && res.content) {
        const price = res.content
        skuPrices.value.forEach(item => {
          item.price = price
        })
      }
    }
  })
}

/**
 * 保存定价
 */
const savePricing = async () => {
  // 构建提交数据，提交所有有效价格
  const priceUpdates = skuPrices.value
    .filter(item => {
      const price = parseFloat(item.price)
      return !isNaN(price) && price > 0
    })
    .map(item => ({
      skuId: item.id,
      price: parseFloat(item.price)
    }))

  if (priceUpdates.length === 0) {
    uni.showToast({ title: '请至少输入一个有效价格', icon: 'none' })
    return
  }

  try {
    submitting.value = true
    await batchUpdatePrice({ skuPrices: priceUpdates })
    uni.showToast({ title: '保存成功', icon: 'success' })
    
    // 跳转回商品列表页
    setTimeout(() => {
      // 触发商品变更事件，通知相关页面刷新
      uni.$emit('product-changed')
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存定价失败:', error)
  } finally {
    submitting.value = false
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  if (query.id) {
    productId.value = Number(query.id)
    loadProduct()
  } else {
    uni.showToast({ title: '商品ID不能为空', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})
</script>

<template>
  <view class="pricing-page">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <wd-loading size="48rpx" />
      <text>加载中...</text>
    </view>

    <template v-else-if="product">
      <!-- 商品信息 -->
      <view class="product-header">
        <view class="product-img">
          <image v-if="product.imageUrl" :src="product.imageUrl" mode="aspectFill" />
          <wd-icon v-else name="goods" size="48rpx" color="#ccc" />
        </view>
        <view class="product-info">
          <view class="product-name">{{ product.name }}</view>
          <view class="product-category">{{ product.categoryName || '未分类' }}</view>
        </view>
      </view>

      <!-- 定价区域 -->
      <view class="pricing-section">
        <view class="section-header">
          <text class="section-title">SKU定价</text>
          <text class="uniform-btn" @tap="applyUniformPrice">统一定价</text>
        </view>

        <view class="sku-list">
          <view v-for="(item, index) in skuPrices" :key="item.id" class="sku-item">
            <!-- 第一行：SKU名称 -->
            <view class="sku-name">{{ item.name }}</view>
            <!-- 第二行：左侧状态，右侧价格输入 -->
            <view class="sku-row">
              <text class="price-status" :class="item.priceStatus === 0 ? 'unpriced' : 'priced'">
                {{ item.priceStatus === 0 ? '未定价' : '已定价' }}
              </text>
              <view class="price-input-wrap">
                <text class="currency">¥</text>
                <input
                  class="price-input"
                  type="digit"
                  v-model="skuPrices[index].price"
                  placeholder="0.00"
                />
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 提示信息 -->
      <view class="tip-section">
        <view class="tip-item">
          <wd-icon name="info-circle" size="28rpx" color="#999" />
          <text>修改价格后点击保存按钮生效</text>
        </view>
        <view class="tip-item">
          <wd-icon name="info-circle" size="28rpx" color="#999" />
          <text>价格为0表示未定价，不可用于开单</text>
        </view>
      </view>
    </template>

    <!-- 底部按钮 -->
    <view class="bottom-bar" v-if="!loading">
      <wd-button
        type="primary"
        :loading="submitting"
        :disabled="!canSave"
        @click="savePricing"
        block
        size="large"
        custom-class="save-btn-custom"
      >
        保存定价
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.pricing-page {
  min-height: 100vh;
  background: $color-bg;
  padding-bottom: 160rpx;
}

.loading-state {
  padding: 200rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  color: $color-text-secondary;
}

.product-header {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: $color-white;
  margin-bottom: 24rpx;
}

.product-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  background: $color-bg;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;

  image {
    width: 100%;
    height: 100%;
  }
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-text-primary;
  margin-bottom: 12rpx;
}

.product-category {
  font-size: $font-size-small;
  color: $color-text-secondary;
}

.pricing-section {
  background: $color-white;
  margin: 0 24rpx 24rpx;
  border-radius: 24rpx;
  padding: 32rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-text-primary;
}

.uniform-btn {
  font-size: $font-size-small;
  color: $color-primary;
}

.sku-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.sku-item {
  display: flex;
  flex-direction: column;
  padding: 24rpx;
  background: $color-bg;
  border-radius: 16rpx;
}

.sku-name {
  font-size: $font-size-large;
  color: $color-text-primary;
  font-weight: 500;
  margin-bottom: 16rpx;
}

.sku-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.price-status {
  font-size: $font-size-secondary;
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  
  &.unpriced {
    background: rgba(239, 68, 68, 0.05);
    color: $color-danger;
  }
  
  &.priced {
    background: rgba(16, 185, 129, 0.05);
    color: $color-success;
  }
}

.price-input-wrap {
  display: flex;
  align-items: center;
  background: $color-white;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  width: 240rpx;
}

.currency {
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-danger;
  margin-right: 8rpx;
}

.price-input {
  flex: 1;
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-text-primary;
  text-align: right;
}

.tip-section {
  padding: 0 24rpx;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 12rpx;
  font-size: $font-size-secondary;
  color: $color-text-secondary;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  background: $color-white;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

:deep(.save-btn-custom) {
  height: 96rpx;
  border-radius: 48rpx;
  font-size: $font-size-title;
  font-weight: 500;
  
  &[disabled] {
    background: $color-border;
  }
}
</style>
