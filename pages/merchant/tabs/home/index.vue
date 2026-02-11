<script setup lang="ts">
/**
 * 商户首页工作台
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { queryInProgressLedgers } from '@/api/modules/ledger'
import { getMerchantStats, getTodayStats, getMerchantDetail } from '@/api/modules/merchant'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useUserStore } from '@/stores/modules/user'
import { LedgerStatus, getLedgerStatusLabel } from '@/enums'
import type { LedgerListVO } from '@/types/ledger'
import type { MerchantStatsVO, TodayStatsVO } from '@/types/merchant'

// ==================== 数据状态 ====================

const refreshing = ref(false)
const loading = ref(false)

// 用户状态
const userStore = useUserStore()

// 导航栏安全区域
const { headerStyle, headerContentStyle } = useNavbarSafeArea()

// 店铺信息 - 从 storage 获取
const storeInfo = ref({
  name: '',
  avatar: ''
})

// 商户头像
const merchantAvatarUrl = ref<string>('')
const avatarLoadError = ref(false)

/**
 * 初始化店铺信息
 */
const initStoreInfo = () => {
  // 从 userStore 获取商户名称
  userStore.initializeFromStorage()
  storeInfo.value.name = userStore.userInfo?.name || '我的店铺'
}

/**
 * 加载商户头像
 */
const loadMerchantAvatar = async () => {
  const merchantId = userStore.userInfo?.merchantId
  if (!merchantId) return
  
  try {
    const detail = await getMerchantDetail(merchantId)
    merchantAvatarUrl.value = detail.avatarUrl || ''
    avatarLoadError.value = false
  } catch (error) {
    console.error('加载商户头像失败:', error)
  }
}

/**
 * 头像加载失败处理
 */
const onAvatarError = () => {
  avatarLoadError.value = true
}

// 销售统计
const stats = ref<MerchantStatsVO>({
  monthlySales: 0,
  pendingAmount: 0,
  monthlyOrders: 0
})

// 今日汇总
const todayStats = ref<TodayStatsVO>({
  sales: 0,
  payment: 0,
  debt: 0,
  orders: 0
})

// 进行中账单列表
const inProgressLedgers = ref<LedgerListVO[]>([])

// ==================== 计算属性 ====================

/**
 * 格式化今日日期：yyyy-mm-dd 星期X
 */
const todayDateStr = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  const weekDay = weekDays[now.getDay()]
  return `${year}-${month}-${day} 星期${weekDay}`
})

// ==================== 方法 ====================

/**
 * 加载进行中账单
 */
const loadInProgressLedgers = async () => {
  try {
    const res = await queryInProgressLedgers({ page: 0, size: 5 })
    inProgressLedgers.value = res.content || []
  } catch (error) {
    console.error('加载进行中账单失败:', error)
  }
}

/**
 * 加载商户统计数据
 */
const loadMerchantStats = async () => {
  const merchantId = userStore.userInfo?.merchantId
  if (!merchantId) return
  
  try {
    const res = await getMerchantStats(merchantId)
    stats.value = res
  } catch (error) {
    console.error('加载商户统计失败:', error)
  }
}

/**
 * 加载今日汇总数据
 */
const loadTodayStats = async () => {
  const merchantId = userStore.userInfo?.merchantId
  if (!merchantId) return
  
  try {
    const res = await getTodayStats(merchantId)
    todayStats.value = res
  } catch (error) {
    console.error('加载今日汇总失败:', error)
  }
}

/**
 * 刷新数据
 */
const onRefresh = async () => {
  refreshing.value = true
  await Promise.all([
    loadInProgressLedgers(),
    loadMerchantStats(),
    loadTodayStats(),
    loadMerchantAvatar()
  ])
  refreshing.value = false
}

/**
 * 快捷操作
 */
const quickActions = [
  { icon: 'add-circle', label: '新建账单', color: '#3B82F6', url: '/pages/merchant/tabs/ledger/add' },
  { icon: 'user-add', label: '添加客户', color: '#10B981', url: '/pages/merchant/tabs/customer/add' },
  { icon: 'goods', label: '添加商品', color: '#F59E0B', url: '/pages/merchant/tabs/product/add' },
  { icon: 'chart', label: '统计报表', color: '#8B5CF6', url: '/pages/merchant/tabs/stats/index' }
]

const handleQuickAction = (action: typeof quickActions[0]) => {
  uni.navigateTo({ url: action.url })
}

/**
 * 查看账单详情
 */
const viewLedgerDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/merchant/tabs/ledger/detail?id=${id}` })
}

/**
 * 获取账单状态样式（使用数字状态）
 */
const getStatusClass = (status: number) => {
  const map: Record<number, string> = {
    [LedgerStatus.IN_PROGRESS]: 'pending',
    [LedgerStatus.PARTIAL]: 'partial',
    [LedgerStatus.ON_CREDIT]: 'debt',
    [LedgerStatus.CLEARED]: 'paid',
    [LedgerStatus.CLOSED]: 'closed'
  }
  return map[status] || 'pending'
}

const getStatusText = (status: number) => {
  return getLedgerStatusLabel(status)
}

/**
 * 查看全部账单（跳转到账单Tab并筛选进行中状态）
 */
const viewAllLedgers = () => {
  // 通过事件通知切换Tab并设置筛选条件
  uni.$emit('switch-to-ledger-tab', { status: LedgerStatus.IN_PROGRESS })
}

// ==================== 生命周期 ====================

/**
 * 商户切换事件处理
 */
const handleMerchantChanged = () => {
  console.log('[Home] 商户已切换，刷新首页数据')
  initStoreInfo()
  loadInProgressLedgers()
  loadMerchantStats()
  loadTodayStats()
  loadMerchantAvatar()
}

/**
 * 账单变更事件处理（新增/编辑账单后刷新）
 */
const handleLedgerChanged = () => {
  console.log('[Home] 账单数据已变更，刷新首页数据')
  loadInProgressLedgers()
  loadMerchantStats()
  loadTodayStats()
}

onMounted(() => {
  initStoreInfo()
  loadInProgressLedgers()
  loadMerchantStats()
  loadTodayStats()
  loadMerchantAvatar()
  // 监听商户切换事件
  uni.$on('merchant-changed', handleMerchantChanged)
  // 监听账单变更事件
  uni.$on('ledger-changed', handleLedgerChanged)
})

onUnmounted(() => {
  // 移除事件监听，避免内存泄漏
  uni.$off('merchant-changed', handleMerchantChanged)
  uni.$off('ledger-changed', handleLedgerChanged)
})
</script>

<template>
  <scroll-view
    class="home-page"
    scroll-y
    refresher-enabled
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
  >
    <!-- 头部店铺信息 -->
    <view class="home-header" :style="headerStyle">
      <view class="store-info" :style="headerContentStyle">
        <view class="store-avatar">
          <image
            v-if="merchantAvatarUrl && !avatarLoadError"
            class="avatar-img"
            :src="merchantAvatarUrl"
            mode="aspectFill"
            lazy-load
            @error="onAvatarError"
          />
          <wd-icon v-else name="shop" size="48rpx" color="#fff" />
        </view>
        <view class="store-detail">
          <view class="store-name">{{ storeInfo.name }}</view>
          <view class="store-tag">商户版</view>
        </view>
        <view class="header-actions">
          <wd-icon name="bell" size="44rpx" color="#fff" />
        </view>
      </view>

      <!-- 销售统计 -->
      <view class="stats-row">
        <view class="stat-item">
          <view class="stat-value">¥{{ stats.monthlySales.toLocaleString() }}</view>
          <view class="stat-label">本月销售</view>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <view class="stat-value debt">¥{{ stats.pendingAmount.toLocaleString() }}</view>
          <view class="stat-label">本月赊账金额</view>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <view class="stat-value">{{ stats.monthlyOrders }}</view>
          <view class="stat-label">本月订单</view>
        </view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="page-content">
      <!-- 快捷操作 -->
      <view class="quick-actions">
        <view
          v-for="action in quickActions"
          :key="action.label"
          class="action-item"
          @tap="handleQuickAction(action)"
        >
          <view class="action-icon" :style="{ background: action.color }">
            <wd-icon :name="action.icon" size="44rpx" color="#fff" />
          </view>
          <text class="action-label">{{ action.label }}</text>
        </view>
      </view>

      <!-- 今日汇总 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">今日汇总</text>
          <text class="section-date">{{ todayDateStr }}</text>
        </view>
        <view class="today-stats">
          <view class="today-item">
            <view class="today-icon blue">
              <wd-icon name="money-circle" size="40rpx" />
            </view>
            <view class="today-info">
              <view class="today-label">销售额</view>
              <view class="today-value">¥{{ todayStats.sales.toLocaleString() }}</view>
            </view>
          </view>
          <view class="today-item">
            <view class="today-icon green">
              <wd-icon name="check-circle" size="40rpx" />
            </view>
            <view class="today-info">
              <view class="today-label">已收款</view>
              <view class="today-value">¥{{ todayStats.payment.toLocaleString() }}</view>
            </view>
          </view>
          <view class="today-item">
            <view class="today-icon red">
              <wd-icon name="warning" size="40rpx" />
            </view>
            <view class="today-info">
              <view class="today-label">新增欠款</view>
              <view class="today-value">¥{{ todayStats.debt.toLocaleString() }}</view>
            </view>
          </view>
          <view class="today-item">
            <view class="today-icon purple">
              <wd-icon name="list" size="40rpx" />
            </view>
            <view class="today-info">
              <view class="today-label">订单数</view>
              <view class="today-value">{{ todayStats.orders }}单</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 进行中的账单 -->
      <view class="section">
        <view class="section-header">
          <text class="section-title">进行中的账单</text>
          <text class="section-more" @tap="viewAllLedgers">查看全部</text>
        </view>

        <view v-if="inProgressLedgers.length === 0" class="empty-state">
          <wd-icon name="inbox" size="80rpx" color="#ddd" />
          <text>暂无进行中的账单</text>
        </view>

        <view v-else class="ledger-list">
          <view
            v-for="ledger in inProgressLedgers"
            :key="ledger.id"
            class="ledger-card"
            @tap="viewLedgerDetail(ledger.id)"
          >
            <view class="ledger-header">
              <view class="customer-info">
                <view class="customer-avatar">
                  {{ ledger.customerName?.charAt(0) || '?' }}
                </view>
                <view class="customer-detail">
                  <view class="customer-name">{{ ledger.customerName }}</view>
                  <view class="ledger-time">{{ ledger.createdAt }}</view>
                </view>
              </view>
              <view class="ledger-status" :class="getStatusClass(ledger.ledgerStatus)">
                {{ getStatusText(ledger.ledgerStatus) }}
              </view>
            </view>
            <view class="ledger-footer">
              <view class="ledger-amount">
                <text class="amount-label">总计</text>
                <text class="amount-value">¥{{ ledger.totalAmount }}</text>
              </view>
              <view class="ledger-paid">
                已付 ¥{{ ledger.paidAmount || 0 }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.home-page {
  height: 100%;
  background: $color-bg;
}

.home-header {
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  padding: 32rpx;
  // padding-top 由 headerStyle 动态控制
}

.store-info {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}

.store-avatar {
  width: 96rpx;
  height: 96rpx;
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

.store-detail {
  flex: 1;
}

.store-name {
  font-size: $font-size-xlarge;
  font-weight: 600;
  color: $color-white;
  margin-bottom: 8rpx;
}

.store-tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  font-size: $font-size-xsmall;
  color: rgba(255, 255, 255, 0.9);
}

.header-actions {
  opacity: 0.9;
}

.stats-row {
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 24rpx 0;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: $font-size-important;
  font-weight: 600;
  color: $color-white;
  margin-bottom: 8rpx;

  &.debt {
    color: rgba(239, 68, 68, 0.6);
  }
}

.stat-label {
  font-size: $font-size-secondary;
  color: rgba(255, 255, 255, 0.8);
}

.stat-divider {
  width: 2rpx;
  background: rgba(255, 255, 255, 0.2);
}

.page-content {
  padding: 24rpx;
}

.quick-actions {
  display: flex;
  background: $color-white;
  border-radius: 24rpx;
  padding: 32rpx 16rpx;
  margin-bottom: 24rpx;
}

.action-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.action-label {
  font-size: $font-size-secondary;
  color: $color-text-regular;
}

.section {
  background: $color-white;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
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

.section-date {
  font-size: $font-size-secondary;
  color: $color-text-secondary;
}

.section-more {
  font-size: $font-size-small;
  color: $color-primary;
}

.today-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.today-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: $color-bg;
  border-radius: 16rpx;
}

.today-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;

  &.blue {
    background: rgba(59, 130, 246, 0.1);
    color: $color-primary;
  }

  &.green {
    background: rgba(16, 185, 129, 0.1);
    color: $color-success;
  }

  &.red {
    background: rgba(239, 68, 68, 0.1);
    color: $color-danger;
  }

  &.purple {
    background: rgba(139, 92, 246, 0.1);
    color: $color-primary;
  }
}

.today-info {
  flex: 1;
}

.today-label {
  font-size: $font-size-secondary;
  color: $color-text-secondary;
  margin-bottom: 4rpx;
}

.today-value {
  font-size: $font-size-title;
  font-weight: 600;
  color: $color-text-primary;
}

.empty-state {
  padding: 60rpx 0;
  text-align: center;
  color: $color-text-secondary;
  font-size: $font-size-content;

  text {
    display: block;
    margin-top: 16rpx;
  }
}

.ledger-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.ledger-card {
  background: $color-bg;
  border-radius: 16rpx;
  padding: 24rpx;
}

.ledger-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.customer-info {
  display: flex;
  align-items: center;
}

.customer-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  color: $color-white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-size-content;
  font-weight: 600;
  margin-right: 16rpx;
}

.customer-detail {
  flex: 1;
}

.customer-name {
  font-size: $font-size-content;
  font-weight: 500;
  color: $color-text-primary;
}

.ledger-time {
  font-size: $font-size-xsmall;
  color: $color-text-secondary;
  margin-top: 4rpx;
}

.ledger-status {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: $font-size-xsmall;

  &.pending {
    background: rgba(245, 158, 11, 0.1);
    color: $color-warning;
  }

  &.partial {
    background: rgba(59, 130, 246, 0.1);
    color: $color-primary;
  }

  &.debt {
    background: rgba(239, 68, 68, 0.1);
    color: $color-danger;
  }

  &.paid {
    background: rgba(16, 185, 129, 0.1);
    color: $color-success;
  }

  &.closed {
    background: $color-bg;
    color: $color-text-regular;
  }
}

.ledger-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16rpx;
  border-top: 2rpx solid #e5e5e5;
}

.ledger-amount {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.amount-label {
  font-size: $font-size-secondary;
  color: $color-text-secondary;
}

.amount-value {
  font-size: $font-size-xlarge;
  font-weight: 600;
  color: $color-text-primary;
}

.ledger-paid {
  font-size: $font-size-secondary;
  color: $color-success;
}
</style>
