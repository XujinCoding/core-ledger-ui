<script setup lang="ts">
/**
 * 游客模式我的Tab页
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref } from 'vue'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useGuestMode } from '@/composables/useGuestMode'

// ==================== 数据状态 ====================

const refreshing = ref(false)

// 导航栏安全区域
const { headerStyle, headerContentStyle } = useNavbarSafeArea()

// 游客模式限制
const { handleGuestAction } = useGuestMode()

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
 * 立即登录
 */
const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' })
}

/**
 * 菜单项点击 - 提示需要登录
 */
const handleMenuClick = (menuName: string) => {
  handleGuestAction(menuName)
}
</script>

<template>
  <scroll-view
    class="mine-page"
    scroll-y
    refresher-enabled
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
  >
    <!-- 头部信息 -->
    <view class="header" :style="headerStyle">
      <view class="user-info">
        <view class="user-avatar">
          <wd-icon name="user" size="56rpx" />
        </view>
        <view class="user-detail" :style="headerContentStyle">
          <view class="user-name-row">
            <text class="user-name">未登录</text>
          </view>
          <view class="user-desc">
            <text>点击下方按钮登录</text>
          </view>
        </view>
      </view>
      
      <!-- 登录按钮 -->
      <view class="login-btn" @tap="goToLogin">
        <wd-icon name="arrow-right" size="32rpx" />
        <text>立即登录</text>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="page-content">
      <!-- 店铺管理 -->
      <view class="menu-section">
        <view class="menu-title">店铺管理</view>
        <view class="menu-item" @tap="handleMenuClick('店铺信息')">
          <view class="menu-icon blue"><wd-icon name="shop" size="36rpx" /></view>
          <text class="menu-text">店铺信息</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
        <view class="menu-item" @tap="handleMenuClick('分类管理')">
          <view class="menu-icon orange"><wd-icon name="app" size="36rpx" /></view>
          <text class="menu-text">分类管理</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
      </view>

      <!-- 数据统计 -->
      <view class="menu-section">
        <view class="menu-title">数据统计</view>
        <view class="menu-item" @tap="handleMenuClick('经营报表')">
          <view class="menu-icon purple"><wd-icon name="chart" size="36rpx" /></view>
          <text class="menu-text">经营报表</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
        <view class="menu-item" @tap="handleMenuClick('欠款汇总')">
          <view class="menu-icon red"><wd-icon name="money-circle" size="36rpx" /></view>
          <text class="menu-text">欠款汇总</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
      </view>

      <view style="height: 40rpx;"></view>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.mine-page {
  height: 100%;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
  padding: 32rpx 32rpx 48rpx;
  color: #fff;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.user-avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
  overflow: hidden;
}

.user-detail {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.user-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.user-name {
  font-size: 40rpx;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-desc {
  font-size: 26rpx;
  opacity: 0.9;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16rpx;
  font-size: 30rpx;
  font-weight: 500;
}

.page-content {
  padding-top: 24rpx;
}

.menu-section {
  background: #fff;
  margin: 0 32rpx 32rpx;
  border-radius: 24rpx;
  overflow: hidden;
}

.menu-title {
  padding: 28rpx 32rpx;
  font-size: 28rpx;
  color: #999;
  border-bottom: 2rpx solid #f5f5f5;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  border-bottom: 2rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }
}

.menu-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;

  &.blue { background: #EBF5FF; color: #3B82F6; }
  &.green { background: #D1FAE5; color: #10B981; }
  &.orange { background: #FEF3C7; color: #F59E0B; }
  &.purple { background: #EDE9FE; color: #8B5CF6; }
  &.red { background: #FEE2E2; color: #EF4444; }
  &.gray { background: #F3F4F6; color: #6B7280; }
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}
</style>
