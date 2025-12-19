<script setup lang="ts">
import { ref, onMounted } from 'vue'

import BillTab from './tabs/bill/index.vue'
import CustomerTab from './tabs/customer/index.vue'
import ProductTab from './tabs/product/index.vue'
import MineTab from './tabs/mine/index.vue'

type TabKey = 'bill' | 'customer' | 'product' | 'mine'
const currentTab = ref<TabKey>('bill')

// 首次访问再挂载，后续使用 v-show 切换（小程序兼容）
const mountedTabs = ref<Record<TabKey, boolean>>({
  bill: true,
  customer: false,
  product: false,
  mine: false
})

const toTab = (tab: TabKey) => {
  currentTab.value = tab
  if (!mountedTabs.value[tab]) {
    mountedTabs.value[tab] = true
  }
}

onMounted(() => {
  currentTab.value = 'bill'
})
</script>

<template>
  <view class="merchant-container">
    <view class="content">
      <!-- 小程序不支持 <component :is>，改为静态组件 + v-show 切换，并按需首次挂载 -->
      <BillTab v-show="currentTab === 'bill'" />
      <CustomerTab v-if="mountedTabs.customer" v-show="currentTab === 'customer'" />
      <ProductTab v-if="mountedTabs.product" v-show="currentTab === 'product'" />
      <MineTab v-if="mountedTabs.mine" v-show="currentTab === 'mine'" />
    </view>

    <view class="tabbar">
      <view class="tabbar-inner">
        <wd-button type="text" :class="{ active: currentTab === 'bill' }" @click="toTab('bill')">账单</wd-button>
        <wd-button type="text" :class="{ active: currentTab === 'customer' }" @click="toTab('customer')">客户</wd-button>
        <wd-button type="text" :class="{ active: currentTab === 'product' }" @click="toTab('product')">商品</wd-button>
        <wd-button type="text" :class="{ active: currentTab === 'mine' }" @click="toTab('mine')">我的</wd-button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.merchant-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 120rpx; // 预留底部导航高度
}
.content {
  min-height: calc(100vh - 120rpx);
}
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-top: 1rpx solid #eee;
}
.tabbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 12rpx 8rpx;
}
.active {
  color: #1989fa;
  font-weight: 600;
}
</style>