<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { getAddress } from '@/api/modules/address'
import type { CustomerVO } from '@/types/customer'

const props = defineProps<{ customer: CustomerVO }>()
const emit = defineEmits<{ (e: 'view', c: CustomerVO): void; (e: 'edit', c: CustomerVO): void }>()

const addressFull = ref<string>('')

const loadAddress = async () => {
  if (props.customer?.addressId) {
    try {
      const a = await getAddress(props.customer.addressId)
      addressFull.value = a?.fullPath || ''
    } catch (e) {
      addressFull.value = ''
    }
  } else {
    addressFull.value = ''
  }
}

watch(
  () => props.customer?.addressId,
  () => {
    loadAddress()
  },
  { immediate: true }
)

const onView = () => emit('view', props.customer)
const onEdit = () => emit('edit', props.customer)
</script>

<template>
  <view class="card">
    <wd-cell-group border>
      <wd-cell :title="props.customer.name" :label="props.customer.customerNo" />
      <wd-cell title="手机号" :value="props.customer.phone || '-'" />
      <wd-cell title="别名" :value="props.customer.alias || '-'" />
      <wd-cell
        title="地址"
        :label="addressFull || '-'"
        :value="props.customer.addressDetail || ''"
      />
    </wd-cell-group>
    <view class="actions">
      <wd-button size="small" type="text" @click="onView">查看</wd-button>
      <wd-button size="small" type="text" @click="onEdit">编辑</wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.card {
  margin: 16rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #fff;
}
.actions {
  display: flex;
  justify-content: flex-end;
  padding: 8rpx 16rpx 16rpx;
}
</style>
