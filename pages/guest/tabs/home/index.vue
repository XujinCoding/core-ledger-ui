<script setup lang="ts">
/**
 * 游客模式首页Tab
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, onMounted } from 'vue'
import { useGuestData } from '@/composables/useGuestData'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useGuestMode } from '@/composables/useGuestMode'

// ==================== 数据状态 ====================

const refreshing = ref(false)

// 导航栏安全区域
const { headerStyle, headerContentStyle } = useNavbarSafeArea()

// 游客数据
const { getCustomers, getLedgers } = useGuestData()
const customers = ref(getCustomers())
const ledgers = ref(getLedgers())

// 游客模式限制
const { handleGuestAction } = useGuestMode()

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

/**
 * 统计数据
 */
const stats = computed(() => {
  if (!customers.value || !ledgers.value) {
    return {
      monthlySales: 0,
      pendingAmount: 0,
      monthlyOrders: 0
    }
  }
  
  const totalDebt = customers.value.reduce((sum, c) => sum + (parseFloat(c.balance as any) || 0), 0)
  const totalAmount = ledgers.value.reduce((sum, l) => sum + (parseFloat(l.totalAmount) || 0), 0)
  const totalPaid = ledgers.value.reduce((sum, l) => sum + (parseFloat(l.paidAmount) || 0), 0)
  
  return {
    monthlySales: totalAmount,
    pendingAmount: totalDebt,
    monthlyOrders: ledgers.value.length
  }
})

/**
 * 今日汇总（示例数据）
 */
const todayStats = computed(() => {
  if (!ledgers.value) {
    return {
      sales: 0,
      payment: 0,
      debt: 0,
      orders: 0
    }
  }
  
  // 使用部分账单数据作为今日数据
  const todayLedgers = ledgers.value.slice(0, 2)
  const sales = todayLedgers.reduce((sum, l) => sum + (parseFloat(l.totalAmount) || 0), 0)
  const payment = todayLedgers.reduce((sum, l) => sum + (parseFloat(l.paidAmount) || 0), 0)
  const debt = sales - payment
  
  return {
    sales,
    payment,
    debt,
    orders: todayLedgers.length
  }
})

/**
 * 进行中的账单（取前5条）
 */
const inProgressLedgers = computed(() => {
  if (!ledgers.value) return []
  return ledgers.value.slice(0, 5)
})

// ==================== 方法 ====================

/**
 * 快捷操作
 */
const quickActions = [
  { icon: 'add-circle', label: '新建账单', color: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)', action: '新建账单' },
  { icon: 'user-add', label: '添加客户', color: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', action: '添加客户' },
  { icon: 'goods', label: '添加商品', color: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', action: '添加商品' },
  { icon: 'chart', label: '统计报表', color: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', action: '统计报表' }
]

/**
 * 处理快捷操作点击
 */
const handleQuickAction = (action: typeof quickActions[0]) => {
  handleGuestAction(action.action)
}

/**
 * 刷新数据
 */
const onRefresh = async () => {
  refreshing.value = true
  // 模拟刷新延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  refreshing.value = false
  uni.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
}

/**
 * 查看账单详情 - 提示需要登录
 */
const viewLedgerDetail = () => {
  handleGuestAction('查看账单详情')
}

/**
 * 获取账单状态样式
 */
const getStatusClass = (status: number) => {
  const map: Record<number, string> = {
    1: 'pending',
    2: 'partial',
    3: 'debt',
    4: 'paid',
    5: 'closed'
  }
  return map[status] || 'pending'
}

/**
 * 获取账单状态文本
 */
const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    1: '进行中',
    2: '部分缴费',
    3: '赊账中',
    4: '已结清',
    5: '已关闭'
  }
  return map[status] || '进行中'
}

/**
 * 查看全部账单
 */
const viewAllLedgers = () => {
  // 通过事件通知切换到账单Tab
  uni.$emit('guest-switch-tab', 'ledger')
}

// ==================== 生命周期 ====================

onMounted(() => {
  // 初始化加载
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
          <view class="store-name">示例店铺</view>
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
            @tap="viewLedgerDetail"
          >
            <view class="ledger-header">
              <view class="customer-info">
                <view class="customer-avatar">
                  {{ ledger.customerName?.charAt(0) || '?' }}
                </view>
                <view class="customer-detail">
                  <view class="customer-name">{{ ledger.customerName }}</view>
                  <view class="ledger-time">{{ ledger.createInstant }}</view>
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

.store-detail {
  flex: 1;
}

.store-name {
  font-size: $font-size-xlarge;
  font-weight: 600;
  color: $color-white;
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
    color: $color-danger;
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
    background: $color-primary-light;
    color: $color-primary;
  }

  &.green {
    background: $color-success-light;
    color: $color-success;
  }

  &.red {
    background: $color-danger-light;
    color: $color-danger;
  }

  &.purple {
    background: $color-primary-light;
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
    background: $color-warning-light;
    color: $color-warning;
  }

  &.partial {
    background: $color-primary-light;
    color: $color-primary;
  }

  &.debt {
    background: $color-danger-light;
    color: $color-danger;
  }

  &.paid {
    background: $color-success-light;
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
