<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getCurrentUser, getUserIdentities } from '@/api/modules/auth'
import { getProfile } from '@/api/modules/customer'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import { useUserStore } from '@/stores/modules/user'
import type { UserInfoVO, CustomerIdentity } from '@/types/auth'
import type { CustomerVO } from '@/types/customer'

const userStore = useUserStore()
const refreshing = ref(false)
const user = ref<UserInfoVO | null>(null)
const profile = ref<CustomerVO | null>(null)
const currentMerchant = ref<CustomerIdentity | null>(null)

// 导航栏安全区域
const { safeArea } = useNavbarSafeArea()

const load = async () => {
  try {
    const info = await getCurrentUser()
    user.value = info

    // 加载客户个人信息
    try {
      const profileInfo = await getProfile()
      profile.value = profileInfo
    } catch (error) {
      console.error('加载个人信息失败:', error)
    }

    // 加载当前商户信息
    try {
      const identities = await getUserIdentities()
      const merchantId = userStore.userInfo?.merchantId
      if (merchantId && identities.customers) {
        currentMerchant.value = identities.customers.find(c => c.merchantId === merchantId) || null
      }
    } catch (error) {
      console.error('加载商户信息失败:', error)
    }
  } finally {
    refreshing.value = false
  }
}

const onRefresh = async () => {
  refreshing.value = true
  await load()
}

onMounted(() => {
  load()
})

const customerName = computed(() => profile.value?.name || user.value?.name || '未设置')
const customerCode = computed(() => {
  if (user.value?.code) {
    return `编号：${user.value.code}`
  }
  return ''
})
const phone = computed(() => user.value?.phone || '-')
const avatarUrl = computed(() => profile.value?.avatarUrl || '')
const merchantName = computed(() => currentMerchant.value?.merchantName || '')

/**
 * 跳转到个人信息页面
 */
const goToProfile = () => {
  uni.navigateTo({
    url: '/pages/customer/profile'
  })
}

/**
 * 跳转到绑定商户页面
 */
const goToBindMerchant = () => {
  uni.navigateTo({
    url: '/pages/customer/bind-merchant'
  })
}

/**
 * 跳转到切换商户页面
 */
const goToSwitchMerchant = () => {
  uni.navigateTo({
    url: '/pages/customer/switch-merchant'
  })
}
</script>

<template>
  <view class="customer-page">
    <scroll-view
      class="tab-scroll"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="section" :style="{ paddingTop: safeArea?.navbarHeight + 'px' }">
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <view class="user-card-bg"></view>
        <view class="user-card-content">
          <view class="user-avatar">
            <image
              v-if="avatarUrl"
              :src="avatarUrl"
              class="avatar-img"
              mode="aspectFill"
            />
            <wd-icon v-else name="user" size="64rpx" color="#fff" />
          </view>
          <view class="user-info">
            <view class="user-name">{{ customerName }}</view>
            <view class="user-code">{{ customerCode || '暂无编号' }}</view>
          </view>
        </view>
        <view class="user-card-footer">
          <view class="info-item">
            <wd-icon name="phone" size="32rpx" color="#666" />
            <text class="info-text">{{ phone }}</text>
          </view>
        </view>
      </view>

      <!-- 当前商户卡片 - 独立突出显示 -->
      <view class="merchant-switch-card" @tap="goToSwitchMerchant">
        <view class="merchant-switch-left">
          <view class="merchant-icon-wrapper">
            <wd-icon name="shop" size="44rpx" color="#fff" />
          </view>
          <view class="merchant-info">
            <view class="merchant-label">当前商户</view>
            <view class="merchant-name">{{ merchantName || '未选择商户' }}</view>
          </view>
        </view>
        <view class="merchant-switch-right">
          <text class="switch-text">切换</text>
          <wd-icon name="arrow-right" size="32rpx" color="#3B82F6" />
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="menu-section">
        <wd-cell-group border>
          <wd-cell
            title="个人信息"
            is-link
            @click="goToProfile"
          >
            <template #icon>
              <view class="menu-icon blue">
                <wd-icon name="user" size="36rpx" color="#3B82F6" />
              </view>
            </template>
          </wd-cell>
          <wd-cell
            title="绑定商户"
            is-link
            @click="goToBindMerchant"
          >
            <template #icon>
              <view class="menu-icon green">
                <wd-icon name="link" size="36rpx" color="#10B981" />
              </view>
            </template>
          </wd-cell>
        </wd-cell-group>
      </view>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.customer-page {
  height: 100vh;
  background: #f5f5f5;
}

.tab-scroll {
  height: 100%;
}

.section {
  padding: $spacing-lg $spacing-lg 0;
}

// 用户信息卡片
.user-card {
  position: relative;
  background: #fff;
  border-radius: $spacing-md;
  overflow: hidden;
  box-shadow: $box-shadow-md;
  margin-bottom: $spacing-md;
}

.user-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
}

.user-card-content {
  position: relative;
  display: flex;
  align-items: center;
  padding: 40rpx $spacing-lg $spacing-lg;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: $border-radius-round;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 6rpx solid #fff;
  box-shadow: $box-shadow-md;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.user-info {
  flex: 1;
  margin-left: $spacing-lg;
}

.user-name {
  font-size: $font-size-xlarge;
  font-weight: 600;
  color: #fff;
  margin-bottom: $spacing-xs;
}

.user-code {
  font-size: $font-size-secondary;
  color: rgba(255, 255, 255, 0.8);
}

.user-card-footer {
  padding: $spacing-md $spacing-lg;
  border-top: 1rpx solid #f0f0f0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: $spacing-small;
}

.info-text {
  font-size: $font-size-content;
  color: #666;
}

// 商户切换卡片 - 独立突出显示
.merchant-switch-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: $spacing-sm;
  padding: $font-size-content $spacing-md;
  margin-bottom: $spacing-md;
  box-shadow: $box-shadow-sm;

  &:active {
    transform: scale(0.98);
    background: #fafafa;
  }
}

.merchant-switch-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex: 1;
  min-width: 0;
}

.merchant-icon-wrapper {
  width: 80rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-radius: $spacing-sm;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.merchant-info {
  flex: 1;
  min-width: 0;
}

.merchant-label {
  font-size: $font-size-secondary;
  color: #999;
  margin-bottom: 4rpx;
}

.merchant-name {
  font-size: $font-size-large;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.merchant-switch-right {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  flex-shrink: 0;
}

.switch-text {
  font-size: $font-size-small;
  color: #3B82F6;
  font-weight: 500;
}

// 功能菜单
.menu-section {
  margin-top: 0;
}

.menu-section :deep(.wd-cell-group) {
  border-radius: $spacing-md;
  overflow: hidden;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: $border-radius-round;
  margin-right: $spacing-md;

  &.blue {
    background: #EFF6FF;
  }

  &.green {
    background: #ECFDF5;
  }
}
</style>
