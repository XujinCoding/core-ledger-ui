<script setup lang="ts">
/**
 * 商户端主页面 - 5Tab结构
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, onMounted } from 'vue'

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
}

onMounted(() => {
  currentTab.value = 'home'
})
</script>

<template>
  <view class="merchant-container">
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
.merchant-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow: hidden;
}

.tabbar {
  flex-shrink: 0;
  background: #fff;
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
  color: #999;
  transition: color 0.2s;

  &.active {
    color: #3B82F6;
  }
}

.tab-label {
  font-size: 22rpx;
  margin-top: 4rpx;
}
</style>