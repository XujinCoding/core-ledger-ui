<script setup lang="ts">
/**
 * 经营报表页面
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/modules/user'
import { getIncomeStats, getProductSales } from '@/api/modules/report'
import type { IncomeStatsVO, ProductSalesVO } from '@/types/report'

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
const incomeStats = ref<IncomeStatsVO | null>(null)
const productSales = ref<ProductSalesVO[]>([])

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

const merchantId = computed(() => userStore.userInfo?.id || 0)

const tabTitle = computed(() => {
  const titles: Record<TimeType, string> = {
    year: '按年',
    month: '按月',
    day: '按日'
  }
  return titles[currentTab.value]
})

const summaryData = computed(() => {
  if (!incomeStats.value) {
    return { totalIncome: '¥0', orderCount: '0', customerCount: '0' }
  }
  return {
    totalIncome: formatMoney(incomeStats.value.totalIncome),
    orderCount: String(incomeStats.value.orderCount),
    customerCount: String(incomeStats.value.customerCount)
  }
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

// 加载收入统计数据
async function loadIncomeData() {
  if (!merchantId.value) return

  loading.value = true
  try {
    const dateParam = getDateParam()
    incomeStats.value = await getIncomeStats(merchantId.value, currentTab.value, dateParam)
  } catch (error) {
    console.error('加载收入数据失败:', error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载商品销售数据（近一年，不随Tab切换）
async function loadProductSales() {
  if (!merchantId.value) return

  try {
    // 固定使用年度数据
    const currentYear = new Date().getFullYear()
    productSales.value = await getProductSales(merchantId.value, 'year', String(currentYear))
  } catch (error) {
    console.error('加载商品销售数据失败:', error)
  }
}

function switchTab(tab: TimeType) {
  currentTab.value = tab
  loadIncomeData()
}

function onYearChange(e: any) {
  selectedYear.value = yearOptions.value[e.detail.value]
  loadIncomeData()
}

function onMonthChange(e: any) {
  selectedMonth.value = e.detail.value
  loadIncomeData()
}

function onDayChange(e: any) {
  selectedDay.value = e.detail.value
  loadIncomeData()
}

function onRefresh() {
  refreshing.value = true
  loadIncomeData()
  loadProductSales()
}

// 获取产品颜色
function getProductColor(index: number): string {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16']
  return colors[index % colors.length]
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadIncomeData()
  loadProductSales()

  // 监听商户切换事件
  uni.$on('merchant-changed', () => {
    loadIncomeData()
    loadProductSales()
  })
})
</script>

<template>
  <scroll-view
    class="report-page"
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

    <!-- 数据概览 -->
    <view class="summary-cards">
      <view class="summary-card">
        <view class="summary-label">总收入</view>
        <view class="summary-value primary">{{ summaryData.totalIncome }}</view>
      </view>
      <view class="summary-card">
        <view class="summary-label">订单数</view>
        <view class="summary-value success">{{ summaryData.orderCount }}</view>
      </view>
      <view class="summary-card">
        <view class="summary-label">客户数</view>
        <view class="summary-value warning">{{ summaryData.customerCount }}</view>
      </view>
    </view>

    <!-- 收入统计 -->
    <view class="chart-section">
      <view class="section-title">收入统计（{{ tabTitle }}）</view>
      <scroll-view v-if="incomeStats?.details?.length" class="chart-scroll" scroll-y>
        <view class="bar-chart">
          <view
            v-for="(item, index) in incomeStats.details"
            :key="index"
            class="bar-item"
          >
            <view class="bar-label">{{ item.label }}</view>
            <view class="bar-wrapper">
              <view
                class="bar-fill"
                :style="{
                  width: `${(item.amount / (incomeStats?.maxAmount || 1)) * 100}%`
                }"
              ></view>
            </view>
            <view class="bar-value">{{ formatMoney(item.amount) }}</view>
          </view>
        </view>
      </scroll-view>
      <view v-else class="empty-chart">
        <text>暂无数据</text>
      </view>
    </view>

    <!-- 商品销售占比（近一年） -->
    <view class="chart-section">
      <view class="section-title">商品销售占比（近一年）</view>
      <scroll-view v-if="productSales.length" class="chart-scroll" scroll-y>
        <view class="pie-legend">
          <view
            v-for="(item, index) in productSales"
            :key="index"
            class="legend-item"
          >
            <view class="legend-dot" :style="{ background: getProductColor(index) }"></view>
            <view class="legend-name">{{ item.productName }}</view>
            <view class="legend-value">{{ item.percentage }}%</view>
            <view class="legend-amount">{{ formatMoney(item.amount) }}</view>
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
.report-page {
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
    background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
    color: #fff;
    border-color: #3B82F6;
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

.summary-cards {
  display: flex;
  gap: 16rpx;
  margin: 0 32rpx 24rpx;
}

.summary-card {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  text-align: center;
}

.summary-label {
  font-size: 24rpx;
  color: #6B7280;
  margin-bottom: 12rpx;
}

.summary-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #111827;

  &.primary { color: #3B82F6; }
  &.success { color: #10B981; }
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

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.bar-label {
  width: 140rpx;
  font-size: 22rpx;
  color: #6B7280;
  flex-shrink: 0;
}

.bar-wrapper {
  flex: 1;
  height: 32rpx;
  background: #F3F4F6;
  border-radius: 16rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%);
  border-radius: 16rpx;
  transition: width 0.3s ease;
  min-width: 4rpx;
}

.bar-value {
  width: 120rpx;
  font-size: 24rpx;
  color: #111827;
  font-weight: 500;
  text-align: right;
  flex-shrink: 0;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.legend-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.legend-name {
  flex: 1;
  font-size: 28rpx;
  color: #374151;
}

.legend-value {
  font-size: 26rpx;
  color: #6B7280;
  width: 80rpx;
  text-align: right;
}

.legend-amount {
  font-size: 28rpx;
  color: #111827;
  font-weight: 500;
  width: 140rpx;
  text-align: right;
}

.empty-chart {
  padding: 60rpx;
  text-align: center;
  color: #9CA3AF;
  font-size: 28rpx;
}
</style>
