<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getCurrentUser } from '@/api/modules/auth'
import type { UserInfoVO } from '@/types/auth'

const refreshing = ref(false)
const user = ref<UserInfoVO | null>(null)

const load = async () => {
  try {
    const info = await getCurrentUser()
    user.value = info
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

const merchantName = computed(() => user.value?.name)
const merchantCode = computed(() => (user.value?.code ? `编号：${user.value.code}` : ''))
const phone = computed(() => user.value?.phone || '-')
</script>

<template>
  <scroll-view
    class="tab-scroll"
    scroll-y
    refresher-enabled
    :refresher-triggered="refreshing"
    @refresherrefresh="onRefresh"
  >
    <view class="section">
      <wd-cell-group border>
        <wd-cell :title="merchantName" :label="merchantCode" />
        <wd-cell title="联系方式" :value="phone" />
      </wd-cell-group>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
.tab-scroll { height: 100%; }
.section :deep(.wd-cell-group) {
  margin: 16rpx;
  border-radius: 12rpx;
  overflow: hidden;
}
</style>
