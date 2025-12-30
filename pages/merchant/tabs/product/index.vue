<script setup lang="ts">
/**
 * 商品管理页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getCategoryTree } from '@/api/modules/category'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { listProducts } from '@/api/modules/product'
import type { CategoryTreeVO } from '@/types/product'
import type { ProductVO } from '@/types/product'

// ==================== 数据状态 ====================

const loading = ref(false)
const keyword = ref('')

// 导航栏安全区域
const { safeArea } = useNavbarSafeArea()

// 分类数据
const categories = ref<CategoryTreeVO[]>([])
const selectedRootIndex = ref(-1)  // -1 表示"全部商品"
const selectedSubCategoryId = ref<number | null>(null)

// 当前选中的根分类
const selectedRoot = computed(() => {
  if (selectedRootIndex.value === -1) return null
  return categories.value[selectedRootIndex.value] || null
})

// 当前根分类的所有子分类
const currentSubCategories = computed(() => {
  if (!selectedRoot.value) return []
  return getAllChildren(selectedRoot.value)
})

// 递归获取所有子分类
const getAllChildren = (category: CategoryTreeVO): CategoryTreeVO[] => {
  const result: CategoryTreeVO[] = []
  if (category.children && category.children.length > 0) {
    for (const child of category.children) {
      result.push(child)
      result.push(...getAllChildren(child))
    }
  }
  return result
}

// 当前用于查询的分类ID
const selectedCategoryId = computed(() => {
  if (selectedSubCategoryId.value) return selectedSubCategoryId.value
  return selectedRoot.value?.id || null
})

// 商品列表
const products = ref<ProductVO[]>([])
const page = ref(0)
const hasMore = ref(true)

// ==================== 计算属性 ====================

// 当前选中分类名称
const currentCategoryName = computed(() => {
  if (!selectedCategoryId.value) return '全部商品'
  const find = (list: CategoryTreeVO[]): string => {
    for (const item of list) {
      if (item.id === selectedCategoryId.value) return item.name
      if (item.children?.length) {
        const found = find(item.children)
        if (found) return found
      }
    }
    return ''
  }
  return find(categories.value) || '全部商品'
})

// ==================== 方法 ====================

/**
 * 加载分类树
 */
const loadCategories = async () => {
  try {
    const res = await getCategoryTree()
    categories.value = res || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

/**
 * 加载商品列表
 */
const loadProducts = async (reset = false) => {
  if (loading.value) return
  if (!reset && !hasMore.value) return

  try {
    loading.value = true
    if (reset) {
      page.value = 0
      products.value = []
    }

    const res = await listProducts(
      {
        categoryId: selectedCategoryId.value || undefined,
        keyword: keyword.value || undefined
      },
      { page: page.value, size: 20 }
    )

    if (reset) {
      products.value = res.content || []
    } else {
      products.value.push(...(res.content || []))
    }

    hasMore.value = (res.content?.length || 0) >= 20
    page.value++
  } catch (error) {
    console.error('加载商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 选择根分类
 */
const selectRootCategory = (index: number) => {
  selectedRootIndex.value = index
  selectedSubCategoryId.value = null
  loadProducts(true)
}

/**
 * 选择子分类
 */
const selectSubCategory = (id: number | null) => {
  selectedSubCategoryId.value = id
  loadProducts(true)
}

/**
 * 搜索
 */
const onSearch = () => {
  loadProducts(true)
}

/**
 * 加载更多
 */
const onLoadMore = () => {
  if (!loading.value && hasMore.value) {
    loadProducts()
  }
}

/**
 * 跳转添加商品
 */
const addProduct = () => {
  uni.navigateTo({ url: '/pages/merchant/tabs/product/add' })
}

/**
 * 编辑商品
 */
const editProduct = (id: number) => {
  uni.navigateTo({ url: `/pages/merchant/tabs/product/add?id=${id}` })
}

/**
 * 商品定价
 */
const pricingProduct = (id: number) => {
  uni.navigateTo({ url: `/pages/merchant/tabs/product/pricing?id=${id}` })
}

/**
 * 跳转分类管理
 */
const goCategoryManage = () => {
  uni.navigateTo({ url: '/pages/merchant/tabs/product/category' })
}

// ==================== 生命周期 ====================

/**
 * 商户切换事件处理
 */
const handleMerchantChanged = () => {
  console.log('[Product] 商户已切换，刷新商品列表')
  loadCategories()
  loadProducts(true)
}

/**
 * 商品变更事件处理（新增/编辑/定价后刷新）
 */
const handleProductChanged = () => {
  console.log('[Product] 商品数据已变更，刷新列表')
  loadCategories()
  loadProducts(true)
}

/**
 * 分类变更事件处理（分类管理页面修改后刷新）
 */
const handleCategoryChanged = () => {
  console.log('[Product] 分类数据已变更，刷新分类')
  loadCategories()
}

/**
 * Tab显示时刷新数据
 */
const handleTabShow = () => {
  console.log('[Product] Tab显示，刷新数据')
  loadCategories()
  loadProducts(true)
}

onMounted(() => {
  // 监听商户切换事件
  uni.$on('merchant-changed', handleMerchantChanged)
  // 监听商品变更事件
  uni.$on('product-changed', handleProductChanged)
  // 监听分类变更事件
  uni.$on('category-changed', handleCategoryChanged)
  // 监听Tab切换事件
  uni.$on('tab-product-show', handleTabShow)
  // 首次挂载时加载数据
  loadCategories()
  loadProducts(true)
})

onUnmounted(() => {
  // 移除事件监听，避免内存泄漏
  uni.$off('merchant-changed', handleMerchantChanged)
  uni.$off('product-changed', handleProductChanged)
  uni.$off('category-changed', handleCategoryChanged)
  uni.$off('tab-product-show', handleTabShow)
})
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
          @tap="keyword = ''; onSearch()"
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
          :class="{ active: selectedRootIndex === -1 }"
          @tap="selectRootCategory(-1)"
        >
          全部商品
        </view>
        <view
          v-for="(cat, index) in categories"
          :key="cat.id"
          class="category-item"
          :class="{ active: selectedRootIndex === index }"
          @tap="selectRootCategory(index)"
        >
          {{ cat.name }}
        </view>
      </scroll-view>

      <!-- 右侧商品列表 -->
      <scroll-view
        class="product-main"
        scroll-y
        @scrolltolower="onLoadMore"
      >
        <!-- 子分类标签 -->
        <view class="sub-category-section" v-if="selectedRoot">
          <view class="sub-category-header">
            <text class="sub-title">{{ selectedRoot.name }}</text>
            <text class="category-manage" @tap="goCategoryManage">分类管理</text>
          </view>
          <view class="sub-category-tags">
            <view
              class="sub-tag"
              :class="{ active: selectedSubCategoryId === null }"
              @tap="selectSubCategory(null)"
            >
              全部
            </view>
            <view
              v-for="sub in currentSubCategories"
              :key="sub.id"
              class="sub-tag"
              :class="{ active: selectedSubCategoryId === sub.id }"
              @tap="selectSubCategory(sub.id)"
            >
              {{ sub.name }}
            </view>
          </view>
        </view>

        <!-- 分类标题 -->
        <view class="category-header">
          <text class="category-title">商品列表 ({{ products.length }})</text>
        </view>

        <!-- 商品网格 -->
        <view v-if="products.length === 0 && !loading" class="empty-state">
          <wd-icon name="goods" size="80rpx" color="#ddd" />
          <text>暂无商品</text>
        </view>

        <view v-else class="product-grid">
          <view
            v-for="product in products"
            :key="product.id"
            class="product-card"
          >
            <!-- 未定价标记 -->
            <view v-if="!product.price" class="price-badge">未定价</view>
            
            <!-- 商品图片 -->
            <view class="product-img">
              <image v-if="product.imageUrl" :src="product.imageUrl" mode="aspectFill" />
              <wd-icon v-else name="goods" size="56rpx" color="#ccc" />
            </view>

            <!-- 商品信息 -->
            <view class="product-info">
              <view class="product-name">{{ product.name }}</view>
              <view class="product-price" :class="{ empty: !product.price }">
                <text>¥</text>{{ product.price || '--' }}
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

        <!-- 加载更多 -->
        <view v-if="loading" class="loading-more">
          <wd-loading size="40rpx" />
        </view>
        <view v-if="!hasMore && products.length > 0" class="no-more">
          没有更多了
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

.sub-category-section {
  margin-bottom: 24rpx;
}

.sub-category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.sub-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.sub-category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.sub-tag {
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #666;

  &.active {
    background: #FEF3C7;
    color: #F59E0B;
    font-weight: 500;
  }
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

.price-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 4rpx 12rpx;
  background: #FEE2E2;
  color: #EF4444;
  font-size: 20rpx;
  border-radius: 8rpx;
  z-index: 1;
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

  &.empty {
    color: #999;
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

.loading-more {
  display: flex;
  justify-content: center;
  padding: 32rpx;
}

.no-more {
  text-align: center;
  padding: 32rpx;
  color: #999;
  font-size: 26rpx;
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
