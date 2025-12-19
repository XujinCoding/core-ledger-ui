<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/modules/user'

const userStore = useUserStore()
const name = computed(() => userStore.userName)
</script>

<template>
  <view class="page">
    <wd-cell-group border>
      <wd-cell title="客户名称" :value="name" />
    </wd-cell-group>
  </view>
</template>

<style lang="scss" scoped>
.page {
  padding: 24rpx;
}
</style>
