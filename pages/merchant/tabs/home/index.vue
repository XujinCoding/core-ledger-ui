<script setup lang="ts">
/**
 * 商户首页工作台
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'
import { queryInProgressLedgers } from '@/api/modules/ledger'
import { getMerchantStats, getTodayStats } from '@/api/modules/merchant'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useUserStore } from '@/stores/modules/user'
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

/**
 * 初始化店铺信息
 */
const initStoreInfo = () => {
  // 从 userStore 获取商户名称
  userStore.initializeFromStorage()
  storeInfo.value.name = userStore.userInfo?.name || '我的店铺'
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
  const merchantId = userStore.userInfo?.id
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
  const merchantId = userStore.userInfo?.id
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
    loadTodayStats()
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
 * 获取账单状态样式
 */
const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    'IN_PROGRESS': 'pending',
    'ON_CREDIT': 'debt',
    'SETTLED': 'paid',
    'CLOSED': 'closed'
  }
  return map[status] || 'pending'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    'IN_PROGRESS': '进行中',
    'ON_CREDIT': '赊账中',
    'SETTLED': '已结清',
    'CLOSED': '已关闭'
  }
  return map[status] || status
}

// ==================== 生命周期 ====================

onMounted(() => {
  initStoreInfo()
  loadInProgressLedgers()
  loadMerchantStats()
  loadTodayStats()
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
          <wd-icon name="shop" size="48rpx" color="#fff" />
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
          <view class="stat-label">待收款</view>
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
          <text class="section-date">{{ new Date().toLocaleDateString() }}</text>
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
          <text class="section-more" @tap="() => {}">查看全部</text>
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
              <view class="ledger-status" :class="getStatusClass(ledger.status)">
                {{ getStatusText(ledger.status) }}
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
  background: #f5f5f5;
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
}

.store-detail {
  flex: 1;
}

.store-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8rpx;
}

.store-tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  font-size: 22rpx;
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
  font-size: 40rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8rpx;

  &.debt {
    color: #FCA5A5;
  }
}

.stat-label {
  font-size: 24rpx;
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
  background: #fff;
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
  font-size: 24rpx;
  color: #666;
}

.section {
  background: #fff;
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
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.section-date {
  font-size: 24rpx;
  color: #999;
}

.section-more {
  font-size: 26rpx;
  color: #3B82F6;
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
  background: #f9fafb;
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
    background: #EBF5FF;
    color: #3B82F6;
  }

  &.green {
    background: #D1FAE5;
    color: #10B981;
  }

  &.red {
    background: #FEE2E2;
    color: #EF4444;
  }

  &.purple {
    background: #EDE9FE;
    color: #8B5CF6;
  }
}

.today-info {
  flex: 1;
}

.today-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.today-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.empty-state {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;

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
  background: #f9fafb;
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
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: 600;
  margin-right: 16rpx;
}

.customer-detail {
  flex: 1;
}

.customer-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.ledger-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.ledger-status {
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  font-size: 22rpx;

  &.pending {
    background: #FEF3C7;
    color: #F59E0B;
  }

  &.debt {
    background: #FEE2E2;
    color: #EF4444;
  }

  &.paid {
    background: #D1FAE5;
    color: #10B981;
  }

  &.closed {
    background: #F3F4F6;
    color: #6B7280;
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
  font-size: 24rpx;
  color: #999;
}

.amount-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.ledger-paid {
  font-size: 24rpx;
  color: #10B981;
}
</style>
