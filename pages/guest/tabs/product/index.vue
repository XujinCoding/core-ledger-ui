<script setup lang="ts">
/**
 * 游客模式商品Tab页
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed } from 'vue'
import { useGuestData } from '@/composables/useGuestData'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useGuestMode } from '@/composables/useGuestMode'

// ==================== 数据状态 ====================

const refreshing = ref(false)
const keyword = ref('')

// 导航栏安全区域
const { safeArea } = useNavbarSafeArea()

// 游客数据
const { getProducts, getCategories } = useGuestData()
const products = ref(getProducts())
const categories = ref(getCategories())

// 游客模式限制
const { handleGuestAction } = useGuestMode()

// 分类选择
const selectedCategoryId = ref<string | null>(null)

// ==================== 计算属性 ====================

/**
 * 过滤后的商品列表
 */
const filteredProducts = computed(() => {
  let result = products.value

  // 按分类筛选
  if (selectedCategoryId.value) {
    result = result.filter(p => p.categoryId === selectedCategoryId.value)
  }

  // 按关键词搜索
  if (keyword.value.trim()) {
    const kw = keyword.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(kw)
    )
  }

  return result
})

/**
 * 当前选中分类名称
 */
const currentCategoryName = computed(() => {
  if (!selectedCategoryId.value) return '全部商品'
  const category = categories.value.find(c => c.id === selectedCategoryId.value)
  return category?.name || '全部商品'
})

// ==================== 方法 ====================

/**
 * 下拉刷新
 */
const onRefresh = async () => {
  refreshing.value = true
  // 模拟刷新延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  refreshing.value = false
  uni.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
}

/**
 * 选择分类
 */
const selectCategory = (id: string | null) => {
  selectedCategoryId.value = id
}

/**
 * 搜索
 */
const onSearch = () => {
  // 搜索逻辑已通过 computed 实现
}

/**
 * 添加商品 - 提示需要登录
 */
const addProduct = () => {
  handleGuestAction('添加商品')
}

/**
 * 编辑商品 - 提示需要登录
 */
const editProduct = (id: string) => {
  handleGuestAction('编辑商品')
}

/**
 * 商品定价 - 提示需要登录
 */
const pricingProduct = (id: string) => {
  handleGuestAction('商品定价')
}

/**
 * 分类管理 - 提示需要登录
 */
const goCategoryManage = () => {
  handleGuestAction('分类管理')
}
</script>

<template>
  <view class="product-page">
    <!-- 固定头部区域 -->
    <view class="fixed-header" :style="{ paddingTop: safeArea?.navbarHeight + 'px' }">
      <!-- 搜索栏 -->
      <view class="search-section">
        <view class="search-input-wrap">
          <wd-icon name="search" size="36rpx" color="#999" />
          <input
            class="search-input"
            v-model="keyword"
            placeholder="搜索商品名称"
            placeholder-class="placeholder"
            confirm-type="search"
            @confirm="onSearch"
          />
          <wd-icon
            v-if="keyword"
            name="close-fill"
            size="32rpx"
            color="#ccc"
            @tap="keyword = ''"
          />
        </view>
      </view>
    </view>

    <!-- 主体布局：左侧分类 + 右侧商品 -->
    <view class="main-layout">
      <!-- 左侧分类栏 -->
      <scroll-view class="category-sidebar" scroll-y>
        <view
          class="category-item"
          :class="{ active: selectedCategoryId === null }"
          @tap="selectCategory(null)"
        >
          全部商品
        </view>
        <view
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ active: selectedCategoryId === cat.id }"
          @tap="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </view>
      </scroll-view>

      <!-- 右侧商品列表 -->
      <scroll-view
        class="product-main"
        scroll-y
        refresher-enabled
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
      >
        <!-- 分类标题 -->
        <view class="category-header">
          <text class="category-title">{{ currentCategoryName }} ({{ filteredProducts.length }})</text>
          <text class="category-manage" @tap="goCategoryManage">分类管理</text>
        </view>

        <!-- 商品网格 -->
        <view v-if="filteredProducts.length === 0" class="empty-state">
          <wd-icon name="goods" size="80rpx" color="#ddd" />
          <text>{{ keyword ? '未找到匹配的商品' : '暂无商品' }}</text>
        </view>

        <view v-else class="product-grid">
          <view
            v-for="product in filteredProducts"
            :key="product.id"
            class="product-card"
          >
            <!-- 商品图片 -->
            <view class="product-img">
              <image v-if="product.imageUrl" :src="product.imageUrl" mode="aspectFill" />
              <wd-icon v-else name="goods" size="56rpx" color="#ccc" />
            </view>

            <!-- 商品信息 -->
            <view class="product-info">
              <view class="product-name">{{ product.name }}</view>
              <view class="product-price">
                <text>¥</text>{{ product.price }}
              </view>
              
              <!-- 操作按钮 -->
              <view class="product-actions">
                <view class="action-btn edit" @tap.stop="editProduct(product.id)">
                  <wd-icon name="edit" size="24rpx" /> 编辑
                </view>
                <view class="action-btn price" @tap.stop="pricingProduct(product.id)">
                  <wd-icon name="money-circle" size="24rpx" /> 定价
                </view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 浮动添加按钮 -->
    <view class="fab-btn" @tap="addProduct">
      <wd-icon name="add" size="48rpx" color="#fff" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.product-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.fixed-header {
  flex-shrink: 0;
  background: #fff;
}

.search-section {
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
  color: #333;
}

.placeholder {
  color: #999;
}

.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.category-sidebar {
  width: 170rpx;
  background: #f5f5f5;
  flex-shrink: 0;
}

.category-item {
  padding: 28rpx 16rpx;
  font-size: 26rpx;
  color: #666;
  text-align: center;
  border-left: 6rpx solid transparent;
  word-break: break-all;
  line-height: 1.4;

  &.active {
    background: #fff;
    color: #3B82F6;
    border-left-color: #3B82F6;
    font-weight: 500;
  }
}

.product-main {
  flex: 1;
  background: #fff;
  padding: 24rpx;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.category-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.category-manage {
  font-size: 26rpx;
  color: #3B82F6;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
  background: #fff;
  min-height: 400rpx;

  text {
    display: block;
    margin-top: 16rpx;
  }
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding-bottom: 120rpx;
}

.product-card {
  background: #f9fafb;
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
}

.product-img {
  width: 100%;
  height: 200rpx;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;

  image {
    width: 100%;
    height: 100%;
  }
}

.product-info {
  padding: 16rpx 20rpx 20rpx;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-price {
  font-size: 32rpx;
  color: #EF4444;
  font-weight: 600;
  margin-bottom: 16rpx;

  text {
    font-size: 24rpx;
  }
}

.product-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  padding: 12rpx 0;
  border-radius: 8rpx;
  font-size: 22rpx;

  &.edit {
    background: #EBF5FF;
    color: #3B82F6;
  }

  &.price {
    background: #FEF3C7;
    color: #F59E0B;
  }
}

.fab-btn {
  position: fixed;
  right: 32rpx;
  bottom: 200rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(59, 130, 246, 0.4);
  z-index: 99;
}
</style>
