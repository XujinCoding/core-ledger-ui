<template>
  <view class="empty-state">
    <wd-icon name="message" custom-class="empty-state__icon" />
    <text class="empty-state__tip">{{ tip }}</text>
    <slot />
  </view>
</template>

<script setup lang="ts">
import { toRefs } from 'vue'
const props = withDefaults(defineProps<{ tip?: string }>(), {
  tip: '暂无数据'
})
const { tip } = toRefs(props)
</script>

<style scoped lang="scss">
.empty-state {
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}
.empty-state__icon {
  font-size: 48px;
  color: #c0c4cc;
}
.empty-state__tip {
  margin-top: 8px;
  font-size: 14px;
}
</style>
