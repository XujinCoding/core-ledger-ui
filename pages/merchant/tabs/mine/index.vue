<script setup lang="ts">
/**
 * 我的页面（商户端）
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'
import { getCurrentUser, getUserIdentities, switchIdentity } from '@/api/modules/auth'
import { getMerchantOverview, getMerchantDetail } from '@/api/modules/merchant'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useUserStore } from '@/stores/modules/user'
import { IdentityType } from '@/enums'
import type { UserInfoVO, MerchantIdentity } from '@/types/auth'

// ==================== 数据状态 ====================

const refreshing = ref(false)
const switching = ref(false)
const user = ref<UserInfoVO | null>(null)
const merchantAvatarUrl = ref<string>('')
const avatarLoadError = ref(false)

// 导航栏安全区域
const { headerStyle, headerContentStyle } = useNavbarSafeArea()

// 用户状态
const userStore = useUserStore()

// 统计数据
const stats = ref({
  customerCount: 0,
  productCount: 0,
  ledgerCount: 0
})

// 店铺列表
const merchants = ref<MerchantIdentity[]>([])
const currentMerchantId = ref<number | null>(null)

// ==================== 方法 ====================

const load = async () => {
  try {
    const info = await getCurrentUser()
    user.value = info
    currentMerchantId.value = info.id
    // 加载统计数据
    await loadOverview(info.id)
    // 加载商户详情获取头像
    await loadMerchantAvatar(info.id)
  } catch (error) {
    console.error('加载用户信息失败:', error)
  } finally {
    refreshing.value = false
  }
}

/**
 * 加载商户头像
 */
const loadMerchantAvatar = async (merchantId: number) => {
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

/**
 * 加载商户概览统计
 */
const loadOverview = async (merchantId: number) => {
  try {
    const res = await getMerchantOverview(merchantId)
    stats.value = {
      customerCount: res.customerCount || 0,
      productCount: res.productCount || 0,
      ledgerCount: res.ledgerCount || 0
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

/**
 * 加载店铺列表
 */
const loadMerchants = async () => {
  try {
    const res = await getUserIdentities()
    merchants.value = res.merchants || []
  } catch (error) {
    console.error('加载店铺列表失败:', error)
  }
}

const onRefresh = async () => {
  refreshing.value = true
  await Promise.all([load(), loadMerchants()])
  refreshing.value = false
}

/**
 * 切换店铺
 */
const switchMerchant = async (id: number) => {
  // 如果已经是当前店铺或正在切换中，不处理
  if (switching.value) return
  if (id === currentMerchantId.value) {
    uni.showToast({ title: '已是当前店铺', icon: 'none' })
    return
  }
  
  switching.value = true
  try {
    const res = await switchIdentity({
      identityType: IdentityType.MERCHANT_OWNER,
      merchantId: id
    })
    // 更新本地状态
    if (res.token) {
      userStore.setToken(res.token)
    }
    userStore.setUserInfo(res.userInfo)
    currentMerchantId.value = id
    user.value = res.userInfo
    
    // 刷新当前页面统计数据
    await loadOverview(id)
    // 刷新商户头像
    await loadMerchantAvatar(id)
    
    // 发送商户切换事件，通知其他页面刷新数据
    uni.$emit('merchant-changed', id)
    
    uni.showToast({ title: '切换成功', icon: 'success' })
  } catch (error) {
    console.error('切换店铺失败:', error)
    // 错误提示已在 request.ts 中处理
  } finally {
    switching.value = false
  }
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
 * 跳转到创建店铺页面
 */
const goToCreateStore = () => {
  uni.navigateTo({ url: '/pages/merchant/settings/store-info?mode=create' })
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
        // 使用 userStore 的 logout 方法清除所有数据
        userStore.logout()
      }
    }
  })
}

// ==================== 生命周期 ====================

onMounted(() => {
  load()
  loadMerchants()
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
    <view class="header" :style="headerStyle">
      <view class="user-info">
        <view class="user-avatar">
          <image
            v-if="merchantAvatarUrl && !avatarLoadError"
            class="avatar-img"
            :src="merchantAvatarUrl"
            mode="aspectFill"
            lazy-load
            @error="onAvatarError"
          />
          <wd-icon v-else name="shop" size="56rpx" />
        </view>
        <view class="user-detail" :style="headerContentStyle">
          <view class="user-name-row">
            <text class="user-name">{{ user?.name || '商户' }}</text>
          </view>
          <view class="user-phone-row">
            <wd-icon name="phone" size="26rpx" color="rgba(255,255,255,0.9)" />
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
        <view class="section-title">
          我的店铺 <text class="section-tip">（点击切换）</text>
          <text class="add-store-btn" @tap="goToCreateStore">+ 新增</text>
        </view>
        <view class="store-list">
          <view
            v-for="merchant in merchants"
            :key="merchant.id"
            class="store-item"
            :class="{ active: merchant.id === currentMerchantId }"
            @tap="switchMerchant(merchant.id)"
          >
            <view class="store-icon">
              <wd-icon name="shop" size="36rpx" />
            </view>
            <view class="store-info">
              <view class="store-name">{{ merchant.name }}</view>
              <view class="store-desc">编号: {{ merchant.code }}</view>
            </view>
            <view class="store-check">
              <wd-icon
                :name="merchant.id === currentMerchantId ? 'check-circle-fill' : 'check-circle'"
                size="40rpx"
                :color="merchant.id === currentMerchantId ? '#3B82F6' : '#e5e5e5'"
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
        <view class="menu-item" @tap="handleMenuClick('category')">
          <view class="menu-icon orange"><wd-icon name="app" size="36rpx" /></view>
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
  padding: 32rpx 32rpx 80rpx;
  // padding-top 由 headerStyle 动态控制
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
  margin-right: 24rpx;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
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

.user-phone-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  opacity: 0.9;
}

.qr-btn {
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
  display: flex;
  align-items: center;
}

.section-tip {
  font-size: 22rpx;
  color: #999;
}

.add-store-btn {
  margin-left: auto;
  color: #3B82F6;
  font-size: 26rpx;
  padding: 8rpx 16rpx;
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
