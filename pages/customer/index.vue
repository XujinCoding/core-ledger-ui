<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getCurrentUser } from '@/api/modules/auth'
import { getProfile } from '@/api/modules/customer'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'
import type { UserInfoVO } from '@/types/auth'
import type { CustomerVO } from '@/types/customer'

const refreshing = ref(false)
const user = ref<UserInfoVO | null>(null)
const profile = ref<CustomerVO | null>(null)

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

/**
 * 跳转到个人信息页面
 */
const goToProfile = () => {
  uni.navigateTo({
    url: '/pages/customer/profile'
  })
}
</script>

<template>
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

      <!-- 功能菜单 -->
      <view class="menu-section">
        <wd-cell-group border>
          <wd-cell
            title="个人信息"
            is-link
            @click="goToProfile"
          >
            <template #icon>
              <view class="menu-icon">
                <wd-icon name="user" size="36rpx" color="#3B82F6" />
              </view>
            </template>
          </wd-cell>
        </wd-cell-group>
      </view>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.tab-scroll {
  height: 100%;
  background: #f5f5f5;
}

.section {
  padding: 32rpx 32rpx 0;
}

// 用户信息卡片
.user-card {
  position: relative;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  margin-bottom: 32rpx;
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
  padding: 40rpx 32rpx 32rpx;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 6rpx solid #fff;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.user-info {
  flex: 1;
  margin-left: 32rpx;
}

.user-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 8rpx;
}

.user-code {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.user-card-footer {
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.info-text {
  font-size: 28rpx;
  color: #666;
}

// 功能菜单
.menu-section {
  margin-top: 0;
}

.menu-section :deep(.wd-cell-group) {
  border-radius: 24rpx;
  overflow: hidden;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #EFF6FF;
  margin-right: 24rpx;
}
</style>
