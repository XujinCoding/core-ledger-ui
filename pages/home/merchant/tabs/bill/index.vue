<script setup lang="ts">
import { ref } from 'vue'

const refreshing = ref(false)

const onRefresh = async () => {
  refreshing.value = true
  // TODO: 加载“账单”数据
  refreshing.value = false
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
    <view class="placeholder">
      <wd-cell-group border>
        <wd-cell title="账单" label="账单页内容开发中" />
      </wd-cell-group>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.tab-scroll { height: 100%; }
.placeholder :deep(.wd-cell-group) {
  margin: 16rpx;
  border-radius: 12rpx;
  overflow: hidden;
}
</style>