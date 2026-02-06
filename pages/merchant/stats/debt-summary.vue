<script setup lang="ts">
/**
 * 欠款汇总页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import { getDebtTrend, getDebtByAddress } from '@/api/modules/report'
import type { DebtTrendVO, DebtByAddressVO } from '@/types/report'

// ==================== 数据状态 ====================

const loading = ref(false)
const refreshing = ref(false)
const userStore = useUserStore()

// 时间维度
type TimeType = 'year' | 'month' | 'day'
const currentTab = ref<TimeType>('month')

// 日期选择
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`)
const selectedDay = ref(formatDate(new Date()))

// 统计数据
const debtTrend = ref<DebtTrendVO | null>(null)
const debtByAddress = ref<DebtByAddressVO[]>([])

// 年份选项
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear - 10; i <= currentYear; i++) {
    years.push(i)
  }
  return years
})

// ==================== 计算属性 ====================

const merchantId = computed(() => userStore.userInfo?.merchantId || 0)

const tabTitle = computed(() => {
  const titles: Record<TimeType, string> = {
    year: '按年',
    month: '按月',
    day: '按日'
  }
  return titles[currentTab.value]
})

const totalDebt = computed(() => {
  if (!debtTrend.value) return '¥0'
  return formatMoney(debtTrend.value.totalDebt)
})

const debtCustomerCount = computed(() => {
  return debtTrend.value?.debtCustomerCount || 0
})

// ==================== 方法 ====================

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatMoney(amount: number): string {
  if (amount >= 10000) {
    return `¥${(amount / 10000).toFixed(1)}万`
  }
  return `¥${amount.toLocaleString()}`
}

function getDateParam(): string {
  switch (currentTab.value) {
    case 'year':
      return String(selectedYear.value)
    case 'month':
      return selectedMonth.value
    case 'day':
      return selectedDay.value
    default:
      return selectedMonth.value
  }
}

// 加载欠款趋势数据
async function loadDebtTrend() {
  if (!merchantId.value) return

  loading.value = true
  try {
    const dateParam = getDateParam()
    debtTrend.value = await getDebtTrend(merchantId.value, currentTab.value, dateParam)
  } catch (error) {
    console.error('加载欠款趋势失败:', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载地址欠款分布（不随Tab切换）
async function loadDebtByAddress() {
  if (!merchantId.value) return

  try {
    const dateParam = getDateParam()
    debtByAddress.value = await getDebtByAddress(merchantId.value, dateParam)
  } catch (error) {
    console.error('加载地址欠款分布失败:', error)
  }
}

function switchTab(tab: TimeType) {
  currentTab.value = tab
  loadDebtTrend()
}

function onYearChange(e: any) {
  selectedYear.value = yearOptions.value[e.detail.value]
  loadDebtTrend()
}

function onMonthChange(e: any) {
  selectedMonth.value = e.detail.value
  loadDebtTrend()
}

function onDayChange(e: any) {
  selectedDay.value = e.detail.value
  loadDebtTrend()
}

function onRefresh() {
  refreshing.value = true
  loadDebtTrend()
  loadDebtByAddress()
}

// 获取地址颜色（根据排名）
function getAddressColor(index: number): string {
  const colors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16']
  return colors[index % colors.length]
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadDebtTrend()
  loadDebtByAddress()

  // 监听商户切换事件
  uni.$on('merchant-changed', () => {
    loadDebtTrend()
    loadDebtByAddress()
  })
})
</script>

<template>
  <scroll-view
    class="debt-page"
    scroll-y
    refresher-enabled
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
  >
    <!-- Tab切换区域 -->
    <view class="tab-section">
      <view class="time-tabs">
        <view
          class="time-tab"
          :class="{ active: currentTab === 'year' }"
          @tap="switchTab('year')"
        >按年</view>
        <view
          class="time-tab"
          :class="{ active: currentTab === 'month' }"
          @tap="switchTab('month')"
        >按月</view>
        <view
          class="time-tab"
          :class="{ active: currentTab === 'day' }"
          @tap="switchTab('day')"
        >按日</view>
      </view>

      <!-- 年选择器 -->
      <view v-if="currentTab === 'year'" class="picker-container">
        <picker mode="selector" :range="yearOptions" @change="onYearChange">
          <view class="picker-input">{{ selectedYear }}年</view>
        </picker>
      </view>

      <!-- 月选择器 -->
      <view v-if="currentTab === 'month'" class="picker-container">
        <picker mode="date" fields="month" :value="selectedMonth" @change="onMonthChange">
          <view class="picker-input">{{ selectedMonth }}</view>
        </picker>
      </view>

      <!-- 日选择器 -->
      <view v-if="currentTab === 'day'" class="picker-container">
        <picker mode="date" :value="selectedDay" @change="onDayChange">
          <view class="picker-input">{{ selectedDay }}</view>
        </picker>
      </view>
    </view>

    <!-- 欠款总额 -->
    <view class="debt-overview">
      <view class="overview-row">
        <view class="overview-item">
          <view class="overview-label">当前欠款总额</view>
          <view class="overview-value danger">{{ totalDebt }}</view>
        </view>
        <view class="overview-item">
          <view class="overview-label">欠款客户数</view>
          <view class="overview-value warning">{{ debtCustomerCount }}</view>
        </view>
      </view>
    </view>

    <!-- 欠款趋势 -->
    <view class="chart-section">
      <view class="section-title">欠款趋势（{{ tabTitle }}）</view>
      <scroll-view v-if="debtTrend?.details?.length" class="chart-scroll" scroll-y>
        <view class="trend-chart">
          <view
            v-for="(item, index) in debtTrend.details"
            :key="index"
            class="trend-item"
          >
            <view class="trend-label">{{ item.label }}</view>
            <view class="trend-bars">
              <view class="trend-bar-group">
                <view class="trend-bar-label">新增</view>
                <view class="trend-bar-wrapper">
                  <view
                    class="trend-bar-fill red"
                    :style="{ width: `${(item.newDebt / (debtTrend?.maxAmount || 1)) * 100}%` }"
                  ></view>
                </view>
                <view class="trend-bar-value">{{ formatMoney(item.newDebt) }}</view>
              </view>
              <view class="trend-bar-group">
                <view class="trend-bar-label">还款</view>
                <view class="trend-bar-wrapper">
                  <view
                    class="trend-bar-fill green"
                    :style="{ width: `${(item.paidAmount / (debtTrend?.maxAmount || 1)) * 100}%` }"
                  ></view>
                </view>
                <view class="trend-bar-value">{{ formatMoney(item.paidAmount) }}</view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
      <view v-else class="empty-chart">
        <text>暂无数据</text>
      </view>
    </view>

    <!-- 地址欠款分布 -->
    <view class="chart-section">
      <view class="section-title">地址欠款分布</view>
      <scroll-view v-if="debtByAddress.length" class="chart-scroll" scroll-y>
        <view class="address-list">
          <view
            v-for="(item, index) in debtByAddress"
            :key="index"
            class="address-item"
          >
            <view class="address-header">
              <view class="address-rank" :style="{ background: getAddressColor(index) }">{{ index + 1 }}</view>
              <view class="address-name">{{ item.address || '未知地址' }}</view>
            </view>
            <view class="address-data">
              <view class="address-bar-wrapper">
                <view
                  class="address-bar-fill"
                  :style="{
                    width: `${(item.amount / (debtByAddress[0]?.amount || 1)) * 100}%`,
                    background: getAddressColor(index)
                  }"
                ></view>
              </view>
              <view class="address-info">
                <view class="address-amount">{{ formatMoney(item.amount) }}</view>
                <view class="address-count">{{ item.customerCount }}位客户</view>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
      <view v-else class="empty-chart">
        <text>暂无数据</text>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.debt-page {
  height: 100vh;
  background: #f5f5f5;
}

.tab-section {
  background: #fff;
  margin: 24rpx 32rpx;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.time-tabs {
  display: flex;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.time-tab {
  flex: 1;
  padding: 20rpx;
  border: 2rpx solid #E5E7EB;
  border-radius: 16rpx;
  background: #fff;
  font-size: 28rpx;
  text-align: center;
  font-weight: 500;
  color: #374151;
  transition: all 0.3s;

  &.active {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
    color: #fff;
    border-color: #EF4444;
  }
}

.picker-container {
  margin-top: 16rpx;
}

.picker-input {
  width: 100%;
  padding: 24rpx;
  border: 2rpx solid #E5E7EB;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #111827;
  background: #F9FAFB;
  text-align: center;
}

.debt-overview {
  background: #fff;
  margin: 0 32rpx 24rpx;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.overview-row {
  display: flex;
  gap: 24rpx;
}

.overview-item {
  flex: 1;
  text-align: center;
}

.overview-label {
  font-size: 26rpx;
  color: #6B7280;
  margin-bottom: 16rpx;
}

.overview-value {
  font-size: 48rpx;
  font-weight: 700;

  &.danger { color: #EF4444; }
  &.warning { color: #F59E0B; }
}

.chart-section {
  background: #fff;
  margin: 0 32rpx 24rpx;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #111827;
  margin-bottom: 24rpx;
}

.chart-scroll {
  max-height: 500rpx;
}

.trend-chart {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.trend-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.trend-label {
  font-size: 24rpx;
  color: #374151;
  font-weight: 500;
}

.trend-bars {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.trend-bar-group {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.trend-bar-label {
  width: 60rpx;
  font-size: 22rpx;
  color: #6B7280;
  flex-shrink: 0;
}

.trend-bar-wrapper {
  flex: 1;
  height: 24rpx;
  background: #F3F4F6;
  border-radius: 12rpx;
  overflow: hidden;
}

.trend-bar-fill {
  height: 100%;
  border-radius: 12rpx;
  transition: width 0.3s ease;
  min-width: 4rpx;

  &.red {
    background: linear-gradient(90deg, #EF4444 0%, #DC2626 100%);
  }

  &.green {
    background: linear-gradient(90deg, #10B981 0%, #059669 100%);
  }
}

.trend-bar-value {
  width: 100rpx;
  font-size: 22rpx;
  color: #111827;
  text-align: right;
  flex-shrink: 0;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.address-item {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.address-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.address-name {
  flex: 1;
  font-size: 28rpx;
  color: #374151;
  font-weight: 500;
  line-height: 1.4;
}

.address-data {
  padding-left: 52rpx;
}

.address-bar-wrapper {
  height: 28rpx;
  background: #F3F4F6;
  border-radius: 14rpx;
  overflow: hidden;
  margin-bottom: 8rpx;
}

.address-bar-fill {
  height: 100%;
  border-radius: 14rpx;
  transition: width 0.3s ease;
  min-width: 4rpx;
}

.address-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.address-amount {
  font-size: 28rpx;
  color: #EF4444;
  font-weight: 600;
}

.address-count {
  font-size: 24rpx;
  color: #6B7280;
}

.empty-chart {
  padding: 60rpx;
  text-align: center;
  color: #9CA3AF;
  font-size: 28rpx;
}
</style>
