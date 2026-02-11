<script setup lang="ts">
/**
 * 游客模式主页面 - 5Tab结构
 * 提供示例数据展示，引导用户登录使用完整功能
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'
import { useNavbarSafeArea } from '@/composables/useNavbarSafeArea'

import HomeTab from './tabs/home/index.vue'
import CustomerTab from './tabs/customer/index.vue'
import LedgerTab from './tabs/ledger/index.vue'
import ProductTab from './tabs/product/index.vue'
import MineTab from './tabs/mine/index.vue'

type TabKey = 'home' | 'customer' | 'ledger' | 'product' | 'mine'
const currentTab = ref<TabKey>('home')

// 按需挂载Tab，避免首次加载全部
const mountedTabs = ref<Record<TabKey, boolean>>({
  home: true,
  customer: false,
  ledger: false,
  product: false,
  mine: false
})

const tabs = [
  { key: 'home' as TabKey, icon: 'home', label: '首页' },
  { key: 'customer' as TabKey, icon: 'user', label: '客户' },
  { key: 'ledger' as TabKey, icon: 'list', label: '账单' },
  { key: 'product' as TabKey, icon: 'goods', label: '商品' },
  { key: 'mine' as TabKey, icon: 'user-circle', label: '我的' }
]

const toTab = (tab: TabKey) => {
  currentTab.value = tab
  if (!mountedTabs.value[tab]) {
    mountedTabs.value[tab] = true
  }
  // 切换Tab时发送事件，通知子组件刷新数据
  setTimeout(() => {
    uni.$emit(`guest-tab-${tab}-show`)
  }, 50)
}

// 导航栏安全区域
const { safeArea, navbarPlaceholderStyle } = useNavbarSafeArea()

// 跳转到登录页面
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/index'
  })
}

onMounted(() => {
  currentTab.value = 'home'
})
</script>

<template>
  <view class="guest-container">
    <!-- Tab内容区域 -->
    <view class="content">
      <HomeTab v-show="currentTab === 'home'" />
      <CustomerTab v-if="mountedTabs.customer" v-show="currentTab === 'customer'" />
      <LedgerTab v-if="mountedTabs.ledger" v-show="currentTab === 'ledger'" />
      <ProductTab v-if="mountedTabs.product" v-show="currentTab === 'product'" />
      <MineTab v-if="mountedTabs.mine" v-show="currentTab === 'mine'" />
    </view>

    <!-- 底部导航栏 -->
    <view class="tabbar">
      <view class="tabbar-inner">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: currentTab === tab.key }"
          @tap="toTab(tab.key)"
        >
          <wd-icon :name="tab.icon" size="44rpx" />
          <text class="tab-label">{{ tab.label }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>

.guest-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: $color-bg;
  overflow: hidden;
}

// Tab内容区域
.content {
  flex: 1;
  overflow: hidden;
}

// 底部导航栏
.tabbar {
  flex-shrink: 0;
  background: $color-white;
  border-top: 2rpx solid #f0f0f0;
  padding-bottom: env(safe-area-inset-bottom);
}

.tabbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 12rpx 0;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 16rpx;
  color: $color-text-secondary;
  transition: color 0.2s;

  &.active {
    color: $color-primary;
  }
}

.tab-label {
  font-size: $font-size-xsmall;
  margin-top: 4rpx;
}
</style>
