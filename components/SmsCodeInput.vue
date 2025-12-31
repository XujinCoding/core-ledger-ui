<script setup lang="ts">
/**
 * 短信验证码输入组件
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref, computed, watch } from 'vue'
import { sendSmsCode, SmsScene } from '@/api/modules/sms'

const props = defineProps<{
  /** 手机号 */
  phone: string
  /** 场景 */
  scene: SmsScene
  /** 验证码值 */
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// 倒计时
const countdown = ref(0)
const sending = ref(false)

// 按钮文字
const btnText = computed(() => {
  if (sending.value) return '发送中...'
  if (countdown.value > 0) return `${countdown.value}s后重发`
  return '获取验证码'
})

// 按钮是否禁用
const btnDisabled = computed(() => {
  return sending.value || countdown.value > 0 || !props.phone || !/^1[3-9]\d{9}$/.test(props.phone)
})

// 倒计时定时器
let timer: number | null = null

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
  }, 1000) as unknown as number
}

// 发送验证码
const handleSend = async () => {
  if (btnDisabled.value) return

  if (!props.phone) {
    uni.showToast({ title: '请输入手机号', icon: 'none' })
    return
  }

  if (!/^1[3-9]\d{9}$/.test(props.phone)) {
    uni.showToast({ title: '手机号格式不正确', icon: 'none' })
    return
  }

  try {
    sending.value = true
    await sendSmsCode({
      phone: props.phone,
      scene: props.scene
    })
    uni.showToast({ title: '验证码已发送', icon: 'success' })
    startCountdown()
  } catch (error) {
    console.error('发送验证码失败:', error)
    // 错误提示已在 request.ts 中处理
  } finally {
    sending.value = false
  }
}

// 输入处理
const handleInput = (e: any) => {
  const value = e.detail.value.replace(/\D/g, '').slice(0, 6)
  emit('update:modelValue', value)
}

// 组件卸载时清除定时器
watch(() => countdown.value, () => {}, { immediate: true })
</script>

<template>
  <view class="sms-code-input">
    <view class="input-wrapper">
      <input
        class="code-input"
        type="number"
        :value="modelValue"
        placeholder="请输入验证码"
        placeholder-class="placeholder"
        maxlength="6"
        @input="handleInput"
      />
      <view 
        class="send-btn" 
        :class="{ disabled: btnDisabled }"
        @tap="handleSend"
      >
        {{ btnText }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sms-code-input {
  width: 100%;
}

.input-wrapper {
  display: flex;
  align-items: center;
  height: 88rpx;
  background: #f9fafb;
  border: 2rpx solid #e5e5e5;
  border-radius: 16rpx;
  overflow: hidden;
}

.code-input {
  flex: 1;
  height: 100%;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: #333;
}

.placeholder {
  color: #999;
}

.send-btn {
  flex-shrink: 0;
  padding: 0 24rpx;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  color: #3B82F6;
  border-left: 2rpx solid #e5e5e5;
  background: #fff;

  &.disabled {
    color: #999;
    background: #f5f5f5;
  }
}
</style>
