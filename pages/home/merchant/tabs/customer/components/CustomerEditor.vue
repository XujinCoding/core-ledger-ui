<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useToast } from '@/uni_modules/wot-design-uni'
import AddressSelector from '@/components/AddressSelector.vue'
import { createCustomer } from '@/api/modules/merchant'
import { updateCustomer } from '@/api/modules/customer'
import type { CustomerVO, CustomerUpdateDTO } from '@/types/customer'
import type { CreateCustomerDTO } from '@/types/merchant'
import { Gender } from '@/enums'

const props = defineProps<{
  visible: boolean
  mode: 'create' | 'edit'
  customer?: CustomerVO | null
  merchantId?: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'saved'): void
}>()

const toast = useToast()
const show = computed({
  get: () => props.visible,
  set: (v: boolean) => emit('update:visible', v)
})

const formRef = ref()
const selectedAddressIds = ref<number[]>([])

const createModel = reactive<CreateCustomerDTO>({
  merchantId: 0,
  customerName: '',
  phone: '',
  addressId: undefined,
  addressDetail: ''
})

const updateModel = reactive<CustomerUpdateDTO>({
  name: '',
  phone: '',
  alias: '',
  gender: undefined,
  age: undefined,
  addressId: undefined,
  addressDetail: ''
})

watch(
  () => props.visible,
  (v: boolean) => {
    if (!v) return
    if (props.mode === 'create') {
      createModel.merchantId = props.merchantId || 0
      createModel.customerName = ''
      createModel.phone = ''
      createModel.addressId = undefined
      createModel.addressDetail = ''
      selectedAddressIds.value = []
    } else if (props.mode === 'edit' && props.customer) {
      updateModel.name = props.customer.name || ''
      updateModel.phone = props.customer.phone || ''
      updateModel.alias = props.customer.alias || ''
      updateModel.gender = props.customer.gender
      updateModel.age = props.customer.age
      updateModel.addressId = props.customer.addressId
      updateModel.addressDetail = props.customer.addressDetail || ''
      selectedAddressIds.value = props.customer.addressId ? [props.customer.addressId] : []
    }
  },
  { immediate: false }
)

const onAddressChange = (ids: number[]) => {
  const last = ids && ids.length ? ids[ids.length - 1] : undefined
  if (props.mode === 'create') {
    createModel.addressId = last
  } else {
    updateModel.addressId = last
  }
}

const rules = {
  name: [{ required: true, message: '请填写姓名' }],
  customerName: [{ required: true, message: '请填写姓名' }],
  phone: [
    { required: true, message: '请填写手机号' },
    { pattern: /^\d{6,20}$/, message: '手机号格式不正确' }
  ]
}

const submitting = ref(false)

const handleSubmit = async () => {
  if (submitting.value) return
  const r = await formRef.value?.validate?.()
  if (!r || !r.valid) return

  submitting.value = true
  try {
    if (props.mode === 'create') {
      if (!createModel.merchantId) {
        toast.error('缺少商户ID')
        return
      }
      await createCustomer(createModel)
      toast.success('创建成功')
    } else if (props.mode === 'edit' && props.customer) {
      await updateCustomer(props.customer.id, updateModel)
      toast.success('保存成功')
    }
    emit('saved')
    show.value = false
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <wd-popup v-model="show" position="bottom" :close-on-click-modal="false" custom-style="height: 86vh">
    <view class="sheet">
      <view class="header">
        <text class="title">{{ props.mode === 'create' ? '新建客户' : '编辑客户' }}</text>
        <wd-button type="text" @click="show = false">关闭</wd-button>
      </view>

      <wd-form ref="formRef" :model="props.mode === 'create' ? createModel : updateModel">
        <wd-cell-group border>
          <wd-input
            v-if="props.mode === 'create'"
            label="姓名"
            prop="customerName"
            clearable
            required
            v-model="createModel.customerName"
            :rules="rules.customerName"
            placeholder="请输入客户姓名"
          />
          <wd-input
            v-else
            label="姓名"
            prop="name"
            clearable
            required
            v-model="updateModel.name"
            :rules="rules.name"
            placeholder="请输入客户姓名"
          />

          <wd-input
            v-if="props.mode === 'create'"
            label="手机号"
            prop="phone"
            clearable
            required
            v-model="createModel.phone"
            :rules="rules.phone"
            placeholder="请输入手机号"
          />
          <wd-input
            v-else
            label="手机号"
            prop="phone"
            clearable
            required
            v-model="updateModel.phone"
            :rules="rules.phone"
            placeholder="请输入手机号"
          />

          <wd-input
            label="别名"
            prop="alias"
            clearable
            v-if="props.mode === 'edit'"
            v-model="updateModel.alias"
            placeholder="请输入别名"
          />

          <wd-radio-group v-if="props.mode === 'edit'" v-model="updateModel.gender" label="性别" inline>
            <wd-radio :value="Gender.MALE">男</wd-radio>
            <wd-radio :value="Gender.FEMALE">女</wd-radio>
          </wd-radio-group>

          <AddressSelector
            v-model="selectedAddressIds"
            label="地址选择"
            @change="onAddressChange"
          />

          <wd-input
            v-if="props.mode === 'create'"
            label="详细地址"
            prop="addressDetail"
            type="textarea"
            :autosize="{ minHeight: 60, maxHeight: 120 }"
            v-model="createModel.addressDetail"
            placeholder="如门牌号、单元等"
          />
          <wd-input
            v-else
            label="详细地址"
            prop="addressDetail"
            type="textarea"
            :autosize="{ minHeight: 60, maxHeight: 120 }"
            v-model="updateModel.addressDetail"
            placeholder="如门牌号、单元等"
          />
        </wd-cell-group>

        <view class="footer">
          <wd-button type="primary" block :loading="submitting" @click="handleSubmit">
            {{ props.mode === 'create' ? '创建' : '保存' }}
          </wd-button>
        </view>
      </wd-form>
    </view>
  </wd-popup>
</template>

<style scoped lang="scss">
.sheet {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
}
.title {
  font-weight: 600;
  font-size: 30rpx;
}
.footer {
  padding: 24rpx 16rpx;
}
</style>
