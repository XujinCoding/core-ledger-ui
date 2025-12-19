<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { queryLedgersByCustomer } from '@/api/modules/ledger'
import type { LedgerListVO } from '@/types/ledger'

const customerId = ref<number | null>(null)
const loading = ref(false)
const list = ref<LedgerListVO[]>([])

const fetchList = async () => {
  if (!customerId.value) {
    list.value = []
    return
  }
  try {
    loading.value = true
    const res = await queryLedgersByCustomer({ customerId: customerId.value }, { page: 1, size: 20 })
    list.value = res.content || []
  } finally {
    loading.value = false
  }
}

onLoad((opts: Record<string, any>) => {
  const id = Number(opts?.customerId)
  customerId.value = Number.isFinite(id) ? id : null
  fetchList()
})
</script>

<template>
  <view class="page">
    <wd-cell-group border>
      <wd-cell title="客户ID" :value="customerId ?? '-'" />
    </wd-cell-group>

    <view class="list">
      <wd-loading v-if="loading" />
      <wd-status-tip v-else-if="!list.length" tip="暂无账单" image="content" />
      <view v-else>
        <wd-cell-group v-for="item in list" :key="item.id" border>
          <wd-cell :title="item.customerName" :label="`总额：${item.totalAmount} ｜ 已付：${item.paidAmount} ｜ 待付：${item.pendingAmount}`" :value="item.createTime" />
        </wd-cell-group>
      </view>
    </view>
  </view>
  
</template>

<style lang="scss" scoped>
.page { padding: 24rpx; }
.list { margin-top: 24rpx; }
</style>
