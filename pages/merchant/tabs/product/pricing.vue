<script setup lang="ts">
/**
 * 商品定价页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted } from 'vue'
import { getProduct } from '@/api/modules/product'
import { batchUpdatePrice } from '@/api/modules/sku'
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
  originalPrice: number
}
const skuPrices = ref<SkuPriceItem[]>([])

// ==================== 计算属性 ====================

const hasChanges = computed(() => {
  return skuPrices.value.some(item => {
    const newPrice = parseFloat(item.price)
    return !isNaN(newPrice) && newPrice !== item.originalPrice
  })
})

// ==================== 方法 ====================

/**
 * 加载商品详情
 */
const loadProduct = async () => {
  try {
    loading.value = true
    const res = await getProduct(productId.value)
    product.value = res
    
    // 初始化SKU价格列表
    if (res.skus && res.skus.length > 0) {
      skuPrices.value = res.skus.map((sku: ProductSkuVO) => ({
        id: sku.id,
        name: sku.name || '默认规格',
        price: sku.price?.toString() || '',
        originalPrice: sku.price || 0
      }))
    } else {
      // 没有SKU时显示默认SKU
      skuPrices.value = [{
        id: res.defaultSkuId || 0,
        name: '默认规格',
        price: res.minPrice?.toString() || '',
        originalPrice: res.minPrice || 0
      }]
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
  // 验证价格
  const invalidItems = skuPrices.value.filter(item => {
    const price = parseFloat(item.price)
    return isNaN(price) || price < 0
  })
  
  if (invalidItems.length > 0) {
    uni.showToast({ title: '请输入有效价格', icon: 'none' })
    return
  }

  try {
    submitting.value = true
    
    const priceUpdates = skuPrices.value
      .filter(item => {
        const newPrice = parseFloat(item.price)
        return !isNaN(newPrice) && newPrice !== item.originalPrice
      })
      .map(item => ({
        skuId: item.id,
        price: parseFloat(item.price)
      }))

    if (priceUpdates.length === 0) {
      uni.showToast({ title: '没有需要保存的修改', icon: 'none' })
      return
    }

    await batchUpdatePrice({ prices: priceUpdates })
    uni.showToast({ title: '保存成功', icon: 'success' })
    
    // 更新原始价格
    skuPrices.value.forEach(item => {
      item.originalPrice = parseFloat(item.price) || 0
    })
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
            <view class="sku-info">
              <text class="sku-name">{{ item.name }}</text>
              <text v-if="item.originalPrice" class="sku-original">
                原价: ¥{{ item.originalPrice.toFixed(2) }}
              </text>
            </view>
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
      <button
        class="save-btn"
        :class="{ disabled: !hasChanges }"
        :loading="submitting"
        :disabled="!hasChanges"
        @tap="savePricing"
      >
        保存定价
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.pricing-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 160rpx;
}

.loading-state {
  padding: 200rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  color: #999;
}

.product-header {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: #fff;
  margin-bottom: 24rpx;
}

.product-img {
  width: 160rpx;
  height: 160rpx;
  border-radius: 16rpx;
  background: #f5f5f5;
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
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.product-category {
  font-size: 26rpx;
  color: #999;
}

.pricing-section {
  background: #fff;
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
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.uniform-btn {
  font-size: 26rpx;
  color: #3B82F6;
}

.sku-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.sku-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: #f9fafb;
  border-radius: 16rpx;
}

.sku-info {
  flex: 1;
}

.sku-name {
  font-size: 30rpx;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}

.sku-original {
  font-size: 24rpx;
  color: #999;
}

.price-input-wrap {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2rpx solid #e5e5e5;
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
  width: 240rpx;
}

.currency {
  font-size: 32rpx;
  font-weight: 600;
  color: #EF4444;
  margin-right: 8rpx;
}

.price-input {
  flex: 1;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
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
  font-size: 24rpx;
  color: #999;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.save-btn {
  width: 100%;
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

  &.disabled {
    background: #ccc;
  }

  &::after {
    border: none;
  }
}
</style>
