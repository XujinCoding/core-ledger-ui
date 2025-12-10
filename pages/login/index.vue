<script setup lang="ts">
	/**
 * 登录首页 - 身份选择和登录入口
 * @author Core Ledger Team
 * @since 1.0.0
 */

	import { ref } from 'vue'
	import { useWechatLogin } from '@/composables/useWechatLogin'
	import { useUserStore } from '@/stores/modules/user'
	import { IdentityType } from '@/enums'

	const userStore = useUserStore()
	const { loading, handleWechatLogin, handleLoginResponse } = useWechatLogin()

	// 身份选择
	const selectedIdentity = ref<number | null>(2)

	// 身份选项
	const identityOptions = [
		{ label: '商家', value: IdentityType.MERCHANT_OWNER },
		{ label: '用户', value: IdentityType.CUSTOMER }
	]

	/**
	 * 处理登录
	 */
	const handleLogin = async () => {
		if (!selectedIdentity.value) {
			uni.showToast({
				title: '请选择身份',
				icon: 'none',
				duration: 2000
			})
			return
		}

		const response = await handleWechatLogin(selectedIdentity.value)

		// 处理登录响应（跳转或显示注册/身份选择页面）
		await handleLoginResponse(response)
	}
</script>

<template>
	<view class="login-page">
		<view class="content">
			core_ledger
		</view>
		<!-- 登录表单 -->
		<view class="content">
			<view class="form-group">
				<!-- 身份选择 -->
				<view class="form-item">
					<view class="identity-selector">
						<wd-picker :columns="identityOptions" label="选择身份" v-model="selectedIdentity" />
					</view>
				</view>

				<!-- 登录按钮 -->
				<wd-button type="primary" block size="middle" :loading="loading" @click="handleLogin"
					class="login-button">
					微信一键登录
				</wd-button>
			</view>
		</view>
	</view>
</template>

<style lang="scss" scoped>
</style>