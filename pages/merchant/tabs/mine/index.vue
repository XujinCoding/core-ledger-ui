<script setup lang="ts">
/**
 * 我的页面（商户端）
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'
import { getCurrentUser } from '@/api/modules/auth'
import type { UserInfoVO } from '@/types/auth'

// ==================== 数据状态 ====================

const refreshing = ref(false)
const user = ref<UserInfoVO | null>(null)

// TODO: 从接口获取 getMerchantStats()
const stats = ref({
  customerCount: 128,
  productCount: 36,
  ledgerCount: 256
})

// TODO: 从接口获取 getMerchantList()
const merchants = ref([
  { id: 1, name: '张记杂货铺', desc: '主店 · 128个客户', active: true },
  { id: 2, name: '二号分店', desc: '分店 · 56个客户', active: false },
  { id: 3, name: '三号分店', desc: '分店 · 32个客户', active: false }
])

// ==================== 方法 ====================

const load = async () => {
  try {
    const info = await getCurrentUser()
    user.value = info
  } catch (error) {
    console.error('加载用户信息失败:', error)
  } finally {
    refreshing.value = false
  }
}

const onRefresh = async () => {
  refreshing.value = true
  await load()
}

/**
 * 切换店铺
 */
const switchMerchant = (id: number) => {
  // TODO: 实现切换店铺逻辑
  merchants.value.forEach(m => {
    m.active = m.id === id
  })
  uni.showToast({ title: '切换成功', icon: 'success' })
}

/**
 * 菜单项点击
 */
const handleMenuClick = (menu: string) => {
  const routes: Record<string, string> = {
    'store-info': '/pages/merchant/settings/store-info',
    'invite': '/pages/merchant/settings/invite',
    'category': '/pages/merchant/tabs/product/category',
    'report': '/pages/merchant/stats/report',
    'debt-summary': '/pages/merchant/stats/debt-summary',
    'notification': '/pages/merchant/settings/notification',
    'security': '/pages/merchant/settings/security',
    'help': '/pages/merchant/settings/help',
    'about': '/pages/merchant/settings/about'
  }
  
  if (routes[menu]) {
    uni.navigateTo({ url: routes[menu] })
  } else {
    uni.showToast({ title: '功能开发中', icon: 'none' })
  }
}

/**
 * 退出登录
 */
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('token')
        uni.removeStorageSync('userInfo')
        uni.reLaunch({ url: '/pages/login/index' })
      }
    }
  })
}

// ==================== 生命周期 ====================

onMounted(() => {
  load()
})
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
    <view class="header">
      <view class="user-info">
        <view class="user-avatar">
          <wd-icon name="shop" size="56rpx" />
        </view>
        <view class="user-detail">
          <view class="user-name">{{ user?.name || '商户' }}</view>
          <view class="user-role">
            <text class="role-tag">商户</text>
            <text class="user-phone">{{ user?.phone || '' }}</text>
          </view>
        </view>
        <view class="qr-btn">
          <wd-icon name="qrcode" size="40rpx" />
        </view>
      </view>
    </view>

    <!-- 页面内容 -->
    <view class="page-content">
      <!-- 统计卡片 -->
      <view class="stat-card">
        <view class="stat-item">
          <view class="stat-value">{{ stats.customerCount }}</view>
          <view class="stat-label">客户数</view>
        </view>
        <view class="stat-item">
          <view class="stat-value">{{ stats.productCount }}</view>
          <view class="stat-label">商品数</view>
        </view>
        <view class="stat-item">
          <view class="stat-value">{{ stats.ledgerCount }}</view>
          <view class="stat-label">账单数</view>
        </view>
      </view>

      <!-- 切换店铺 -->
      <view class="switch-section">
        <view class="section-title">切换店铺 <text class="section-tip">（点击切换）</text></view>
        <view class="store-list">
          <view
            v-for="merchant in merchants"
            :key="merchant.id"
            class="store-item"
            :class="{ active: merchant.active }"
            @tap="switchMerchant(merchant.id)"
          >
            <view class="store-icon">
              <wd-icon name="shop" size="36rpx" />
            </view>
            <view class="store-info">
              <view class="store-name">{{ merchant.name }}</view>
              <view class="store-desc">{{ merchant.desc }}</view>
            </view>
            <view class="store-check">
              <wd-icon
                :name="merchant.active ? 'check-circle-fill' : 'check-circle'"
                size="40rpx"
                :color="merchant.active ? '#3B82F6' : '#e5e5e5'"
              />
            </view>
          </view>
        </view>
      </view>

      <!-- 店铺管理 -->
      <view class="menu-section">
        <view class="menu-title">店铺管理</view>
        <view class="menu-item" @tap="handleMenuClick('store-info')">
          <view class="menu-icon blue"><wd-icon name="shop" size="36rpx" /></view>
          <text class="menu-text">店铺信息</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
        <view class="menu-item" @tap="handleMenuClick('invite')">
          <view class="menu-icon green"><wd-icon name="qrcode" size="36rpx" /></view>
          <text class="menu-text">邀请客户</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
        <view class="menu-item" @tap="handleMenuClick('category')">
          <view class="menu-icon orange"><wd-icon name="tag" size="36rpx" /></view>
          <text class="menu-text">分类管理</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
      </view>

      <!-- 数据统计 -->
      <view class="menu-section">
        <view class="menu-title">数据统计</view>
        <view class="menu-item" @tap="handleMenuClick('report')">
          <view class="menu-icon purple"><wd-icon name="chart" size="36rpx" /></view>
          <text class="menu-text">经营报表</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
        <view class="menu-item" @tap="handleMenuClick('debt-summary')">
          <view class="menu-icon red"><wd-icon name="money-circle" size="36rpx" /></view>
          <text class="menu-text">欠款汇总</text>
          <view class="menu-badge">3</view>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
      </view>

      <!-- 系统设置 -->
      <view class="menu-section">
        <view class="menu-title">系统设置</view>
        <view class="menu-item" @tap="handleMenuClick('notification')">
          <view class="menu-icon gray"><wd-icon name="bell" size="36rpx" /></view>
          <text class="menu-text">消息通知</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
        <view class="menu-item" @tap="handleMenuClick('security')">
          <view class="menu-icon gray"><wd-icon name="shield" size="36rpx" /></view>
          <text class="menu-text">账号安全</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
        <view class="menu-item" @tap="handleMenuClick('help')">
          <view class="menu-icon gray"><wd-icon name="help-circle" size="36rpx" /></view>
          <text class="menu-text">帮助与反馈</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
        <view class="menu-item" @tap="handleMenuClick('about')">
          <view class="menu-icon gray"><wd-icon name="info-circle" size="36rpx" /></view>
          <text class="menu-text">关于我们</text>
          <wd-icon name="arrow-right" size="32rpx" color="#ccc" />
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-btn" @tap="handleLogout">
        <wd-icon name="power" size="32rpx" />
        退出登录
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
  padding: 48rpx 32rpx 80rpx;
  color: #fff;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 32rpx;
}

.user-detail {
  flex: 1;
}

.user-name {
  font-size: 40rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.user-role {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  opacity: 0.9;
}

.role-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.qr-btn {
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-content {
  margin-top: -48rpx;
  position: relative;
  z-index: 1;
}

.stat-card {
  display: flex;
  background: #fff;
  margin: 0 32rpx 32rpx;
  border-radius: 24rpx;
  padding: 40rpx 0;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 44rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.switch-section {
  background: #fff;
  margin: 0 32rpx 32rpx;
  border-radius: 24rpx;
  padding: 32rpx;
}

.section-title {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 24rpx;
}

.section-tip {
  font-size: 22rpx;
  color: #999;
}

.store-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.store-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-radius: 16rpx;
  border: 4rpx solid #e5e5e5;
  gap: 24rpx;

  &.active {
    border-color: #3B82F6;
    background: #EBF5FF;
  }
}

.store-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;

  .store-item.active & {
    background: #3B82F6;
    color: #fff;
  }
}

.store-info {
  flex: 1;
}

.store-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 4rpx;

  .store-item.active & {
    color: #3B82F6;
  }
}

.store-desc {
  font-size: 24rpx;
  color: #999;
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

.menu-badge {
  background: #EF4444;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-right: 16rpx;
}

.logout-btn {
  margin: 0 32rpx;
  padding: 28rpx;
  background: #fff;
  border-radius: 24rpx;
  text-align: center;
  color: #EF4444;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}
</style>
