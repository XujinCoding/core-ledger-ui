<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { getCustomer, getCustomerStats } from '@/api/modules/customer'
import { queryLedgersByCustomer } from '@/api/modules/ledger'
import type { CustomerVO, CustomerStatsVO } from '@/types/customer'
import type { LedgerListVO } from '@/types/ledger'
import CustomerInfoCard from '@/components/customer/CustomerInfoCard.vue'
import ConsumptionStatsCard from '@/components/customer/ConsumptionStatsCard.vue'

// ==================== 页面参数 ====================
const customerId = ref<number>(0)

// ==================== 数据状态 ====================
const loading = ref(true)
const refreshing = ref(false)
const customer = ref<CustomerVO>({} as CustomerVO)
const avatarLoadError = ref(false)
const stats = ref<CustomerStatsVO>({
  totalAmount: 0,
  orderCount: 0,
  avgAmount: 0
})
const ledgers = ref<LedgerListVO[]>([])
const hasMore = ref(true)
const page = ref(0)
const loadingMore = ref(false)

// ==================== 方法 ====================

/**
 * 加载客户详情
 */
const loadCustomerDetail = async () => {
  try {
    loading.value = true
    customer.value = await getCustomer(customerId.value)
    avatarLoadError.value = false
    await Promise.all([
      loadCustomerStats(),
      loadRecentLedgers(true)
    ])
  } catch (error) {
    console.error('加载客户详情失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

/**
 * 头像加载失败处理
 */
const onAvatarError = () => {
  avatarLoadError.value = true
}

/**
 * 加载客户统计信息
 */
const loadCustomerStats = async () => {
  try {
    stats.value = await getCustomerStats(customerId.value)
  } catch (error) {
    console.error('加载客户统计信息失败:', error)
  }
}

/**
 * 加载最近账单
 */
const loadRecentLedgers = async (reset = false) => {
  if (loadingMore.value) return
  if (!reset && !hasMore.value) return

  try {
    loadingMore.value = true
    if (reset) {
      page.value = 0
      ledgers.value = []
      hasMore.value = true
    }

    const res = await queryLedgersByCustomer(
      { customerId: customerId.value },
      { page: page.value, size: 10 }
    )

    if (reset) {
      ledgers.value = res.content || []
    } else {
      ledgers.value.push(...(res.content || []))
    }

    hasMore.value = !res.last
    page.value++
  } catch (error) {
    console.error('加载账单列表失败:', error)
    uni.showToast({ title: '加载账单失败', icon: 'none' })
  } finally {
    loadingMore.value = false
  }
}

/**
 * 下拉刷新
 */
const onRefresh = async () => {
  refreshing.value = true
  await loadCustomerDetail()
  refreshing.value = false
  uni.stopPullDownRefresh()
}

/**
 * 客户变更事件处理（编辑后刷新）
 */
const handleCustomerChanged = () => {
  console.log('[CustomerDetail] 客户数据已变更，刷新详情')
  loadCustomerDetail()
}

/**
 * 账单变更事件处理（新增/编辑账单后刷新）
 */
const handleLedgerChanged = () => {
  console.log('[CustomerDetail] 账单数据已变更，刷新账单列表')
  loadCustomerStats()
  loadRecentLedgers(true)
}

/**
 * 加载更多
 */
const onLoadMore = () => {
  if (!loadingMore.value && hasMore.value) {
    loadRecentLedgers()
  }
}

/**
 * 查看账单详情
 */
const viewLedgerDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/merchant/tabs/ledger/detail?id=${id}` })
}

/**
 * 创建新账单
 */
const createLedger = () => {
  uni.navigateTo({ url: `/pages/merchant/tabs/ledger/add?customerId=${customerId.value}` })
}

/**
 * 查看全部账单
 */
const viewAllLedgers = () => {
  uni.navigateTo({ url: `/pages/merchant/tabs/customer/ledger?id=${customerId.value}` })
}

/**
 * 编辑客户信息
 */
const editCustomer = () => {
  uni.navigateTo({ url: `/pages/merchant/tabs/customer/add?id=${customerId.value}&edit=true` })
}

/**
 * 联系客户
 */
const contactCustomer = () => {
  if (!customer.value.phone) {
    uni.showToast({ title: '客户未设置手机号', icon: 'none' })
    return
  }
  uni.makePhoneCall({
    phoneNumber: customer.value.phone,
    fail: () => {
      uni.showToast({ title: '拨打电话失败', icon: 'none' })
    }
  })
}

// ==================== 生命周期 ====================
onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1] as any
  const query = currentPage.options || {}
  
  if (query.id) {
    customerId.value = Number(query.id)
    loadCustomerDetail()
  } else {
    uni.showToast({ title: '客户ID不能为空', icon: 'none' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
  
  // 监听客户变更事件
  uni.$on('customer-changed', handleCustomerChanged)
  // 监听账单变更事件
  uni.$on('ledger-changed', handleLedgerChanged)
})

onUnmounted(() => {
  // 移除事件监听
  uni.$off('customer-changed', handleCustomerChanged)
  uni.$off('ledger-changed', handleLedgerChanged)
})

// 开启下拉刷新
onPullDownRefresh(() => {
  onRefresh()
})
</script>

<template>
  <view class="customer-detail-page">
    <!-- 头部信息 -->
    <view class="header">
      <view class="user-info">
        <view class="avatar">
          <image
            v-if="customer.avatarUrl && !avatarLoadError"
            class="avatar-img"
            :src="customer.avatarUrl"
            mode="aspectFill"
            lazy-load
            @error="onAvatarError"
          />
          <text v-else class="avatar-text">{{ customer.name?.charAt(0) || '?' }}</text>
        </view>
        <view class="info">
          <view class="name">
            {{ customer.name || '未命名客户' }}
            <text v-if="customer.alias" class="nickname">({{ customer.alias }})</text>
          </view>
          <view class="phone" @tap="contactCustomer">
            <wd-icon name="phone" size="28rpx" />
            {{ customer.phone || '暂无电话' }}
          </view>
          <view class="address" v-if="customer.addressPath || customer.addressDetail">
            <wd-icon name="location" size="28rpx" />
            {{ [customer.addressPath, customer.addressDetail].filter(Boolean).join(' ') }}
          </view>
        </view>
      </view>
      <view class="actions">
        <view class="action-item" @tap="contactCustomer">
          <wd-icon name="phone" size="40rpx" color="#3B82F6" />
          <text>联系</text>
        </view>
        <view class="action-item" @tap="editCustomer">
          <wd-icon name="edit" size="40rpx" color="#3B82F6" />
          <text>编辑</text>
        </view>
      </view>
    </view>

    <!-- 主要内容 -->
    <scroll-view
      class="content-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <!-- 加载中 -->
      <wd-loading v-if="loading" size="48rpx" color="#3B82F6" class="loading">
        加载中...
      </wd-loading>

      <template v-else>
        <!-- 消费统计 -->
        <ConsumptionStatsCard :stats="stats" />

        <!-- 客户信息 -->
        <CustomerInfoCard :customer="customer" />

        <!-- 最近账单 -->
        <view class="recent-ledgers">
          <view class="section-header">
            <text class="title">最近账单</text>
            <text class="more" @tap="viewAllLedgers">
              查看全部
              <wd-icon name="arrow-right" size="24rpx" />
            </text>
          </view>

          <view v-if="ledgers.length === 0" class="empty-ledgers">
            <wd-icon name="list" size="80rpx" color="#ddd" />
            <text>暂无账单记录</text>
          </view>

          <view v-else class="ledger-list">
            <view
              v-for="ledger in ledgers"
              :key="ledger.id"
              class="ledger-item"
              @tap="viewLedgerDetail(ledger.id)"
            >
              <view class="ledger-info">
                <view class="ledger-title">
                  {{ ledger.createInstant.substring(0, 10) + ' - '+ ledger.customerName || '未命名账单' }}
                </view>
                <view class="ledger-time">
                  {{ ledger.createdAt }}
                </view>
              </view>
              <view class="ledger-amount">
                ¥{{ ledger.totalAmount }}
              </view>
            </view>
          </view>
        </view>
      </template>

      <!-- 加载更多 -->
      <view v-if="loadingMore" class="loading-more">
        <wd-loading size="36rpx" />
        <text>加载中...</text>
      </view>
      <view v-else-if="!hasMore && ledgers.length > 0" class="no-more">
        没有更多了
      </view>
    </scroll-view>

    <!-- 底部操作栏 -->
    <view class="bottom-actions">
      <button class="btn btn-primary" @tap="createLedger">
        <wd-icon name="add" size="36rpx" />
        新建账单
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.customer-detail-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $color-bg;
}

.header {
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: $color-white;
  padding: 40rpx 32rpx 60rpx;
  position: relative;
  z-index: 1;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 40rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-text {
  font-size: $font-size-big;
  font-weight: 600;
  color: $color-white;
}

.info {
  flex: 1;
}

.name {
  font-size: $font-size-important;
  font-weight: 600;
  margin-bottom: 8rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nickname {
  font-size: $font-size-secondary;
  opacity: 0.8;
  font-weight: normal;
}

.phone {
  font-size: $font-size-content;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.address {
  font-size: $font-size-small;
  opacity: 0.85;
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
}

.actions {
  display: flex;
  justify-content: space-around;
  background: $color-white;
  border-radius: 20rpx;
  padding: 24rpx 0;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 2;
  margin-top: -20rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  width: 25%;
  
  text {
    font-size: $font-size-secondary;
    color: $color-text-regular;
  }
}

.content-scroll {
  flex: 1;
  padding: 0 24rpx 120rpx;
  box-sizing: border-box;
  margin-top: -40rpx;
  position: relative;
  z-index: 1;
}

.loading {
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  color: $color-text-secondary;
}

.recent-ledgers {
  background: $color-white;
  border-radius: 20rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  
  .title {
    font-size: $font-size-title;
    font-weight: 600;
    color: $color-text-primary;
  }
  
  .more {
    font-size: $font-size-secondary;
    color: $color-text-secondary;
    display: flex;
    align-items: center;
    gap: 4rpx;
  }
}

.empty-ledgers {
  padding: 60rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  color: $color-text-secondary;
  font-size: $font-size-content;
}

.ledger-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.ledger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.ledger-info {
  flex: 1;
  margin-right: 20rpx;
}

.ledger-title {
  font-size: $font-size-content;
  color: $color-text-primary;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ledger-time {
  font-size: $font-size-secondary;
  color: $color-text-secondary;
}

.ledger-amount {
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-primary;
  flex-shrink: 0;
}

.loading-more,
.no-more {
  text-align: center;
  padding: 32rpx 0;
  color: $color-text-secondary;
  font-size: $font-size-small;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.bottom-actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 20rpx 24rpx;
  background: $color-white;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
  display: flex;
  gap: 20rpx;
  
  .btn {
    flex: 1;
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $font-size-large;
    font-weight: 500;
    border: none;
    
    &::after {
      border: none;
    }
    
    &.btn-primary {
      background: $color-primary;
      color: $color-white;
    }
    
    &.btn-outline {
      background: $color-white;
      color: $color-primary;
      border: 2rpx solid #3B82F6;
    }
  }
}
</style>
