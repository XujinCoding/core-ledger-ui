<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { listAddressesByParent, getAddressChain } from '@/api/modules/address'
import type { AddressVO, AddressChainVO } from '@/types/address'

// 地址项类型
interface AddressItem {
	id: number
	name: string
	level: number
}

// 定义 Props
interface Props {
	modelValue?: number | null  // 选中的地址ID（最后一级）
	label?: string              // 标签文字
	placeholder?: string        // 占位符
	required?: boolean          // 是否必填
	disabled?: boolean          // 是否禁用
	minLevel?: number           // 最少选择层数（1-5）
	maxLevel?: number           // 最多选择层数（1-5）
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	label: '地址',
	placeholder: '请选择地址',
	required: false,
	disabled: false,
	minLevel: 1,
	maxLevel: 5
})

// 定义 Emits
const emit = defineEmits<{
	(e: 'update:modelValue', value: number | null): void
	(e: 'change', value: number | null, addressChain: AddressItem[]): void
}>()

// 弹出层显示状态
const showPopup = ref(false)
// 当前选中的层级索引
const currentTabIndex = ref(0)
// 各级地址数据
const levelData = ref<AddressItem[][]>([])
// 各级选中的地址
const selectedItems = ref<AddressItem[]>([])
// 加载状态
const loading = ref(false)
// 临时选中项（用于弹出层内操作）
const tempSelectedItems = ref<AddressItem[]>([])
// 缓存的完整路径（用于初始显示，避免加载各级数据）
const cachedFullPath = ref('')
// 缓存的地址链数据（延迟加载用）
const cachedChainData = ref<AddressChainVO | null>(null)

// 层级标签
const levelLabels = ['省/市', '市/区', '区/县', '乡/镇', '村/社区']

// 显示文本
const displayText = computed(() => {
	// 优先使用已选择的地址链
	if (selectedItems.value.length > 0) {
		return selectedItems.value.map((item: AddressItem) => item.name).join('-')
	}
	// 其次使用缓存的完整路径
	if (cachedFullPath.value) {
		return cachedFullPath.value
	}
	return ''
})

// 当前可用的tab列表
const availableTabs = computed(() => {
	const tabs: { label: string; index: number }[] = []
	for (let i = 0; i <= tempSelectedItems.value.length && i < props.maxLevel; i++) {
		if (i < tempSelectedItems.value.length) {
			tabs.push({ label: tempSelectedItems.value[i].name, index: i })
		} else if (levelData.value[i] && levelData.value[i].length > 0) {
			tabs.push({ label: levelLabels[i] || `第${i + 1}级`, index: i })
		}
	}
	return tabs
})

// 当前层级的地址列表
const currentLevelList = computed(() => {
	return levelData.value[currentTabIndex.value] || []
})

// 是否可以确认选择
const canConfirm = computed(() => {
	return tempSelectedItems.value.length >= props.minLevel
})

// 初始化加载
onMounted(async () => {
	if (props.modelValue) {
		await initDisplayText(props.modelValue)
	}
})

// 监听 modelValue 变化
watch(() => props.modelValue, async (newVal: number | null | undefined) => {
	if (newVal && newVal !== selectedItems.value[selectedItems.value.length - 1]?.id) {
		await initDisplayText(newVal)
	} else if (!newVal) {
		selectedItems.value = []
		tempSelectedItems.value = []
		cachedFullPath.value = ''
		cachedChainData.value = null
	}
}, { immediate: false })

// 加载顶级地址
async function loadTopLevel() {
	try {
		loading.value = true
		const data = await listAddressesByParent(0)
		levelData.value = [data.map((item: AddressVO) => ({
			id: item.id,
			name: item.name,
			level: item.level
		}))]
	} catch (error) {
		console.error('加载地址数据失败:', error)
	} finally {
		loading.value = false
	}
}

// 初始化显示文本（只获取 fullPath，不加载各级数据）
async function initDisplayText(addressId: number) {
	try {
		const chainData = await getAddressChain(addressId) as AddressChainVO
		
		if (!chainData) {
			return
		}
		
		// 缓存数据，等点击时再加载
		cachedChainData.value = chainData
		cachedFullPath.value = chainData.fullPath || ''
	} catch (error) {
		console.error('获取地址信息失败:', error)
	}
}

// 根据缓存数据加载各级地址（点击时调用）
async function loadChainData() {
	const chainData = cachedChainData.value
	if (!chainData || !chainData.addressIds || chainData.addressIds.length === 0) {
		return
	}
	
	try {
		loading.value = true
		
		// 解析地址链
		const chain: AddressItem[] = []
		const { addressIds, addressNames, addressLevels } = chainData
		
		for (let i = 0; i < addressIds.length; i++) {
			chain.push({
				id: addressIds[i],
				name: addressNames[i],
				level: addressLevels[i]
			})
		}
		
		if (chain.length === 0) return
		
		// 加载顶级数据
		if (levelData.value.length === 0) {
			await loadTopLevel()
		}
		
		// 加载每级的子级数据
		for (let i = 0; i < chain.length - 1; i++) {
			const childData = await listAddressesByParent(chain[i].id)
			if (childData && childData.length > 0) {
				levelData.value[i + 1] = childData.map((item: AddressVO) => ({
					id: item.id,
					name: item.name,
					level: item.level
				}))
			}
		}
		
		// 尝试加载最后一级的子级
		const lastItem = chain[chain.length - 1]
		const lastChildData = await listAddressesByParent(lastItem.id)
		if (lastChildData && lastChildData.length > 0) {
			levelData.value[chain.length] = lastChildData.map((item: AddressVO) => ({
				id: item.id,
				name: item.name,
				level: item.level
			}))
		}
		
		selectedItems.value = [...chain]
		tempSelectedItems.value = [...chain]
		
		// 清除缓存，已加载完成
		cachedChainData.value = null
	} catch (error) {
		console.error('加载地址数据失败:', error)
	} finally {
		loading.value = false
	}
}

// 打开选择器
async function openPicker() {
	if (props.disabled) return
	
	// 加载顶级数据（如果还没加载）
	if (levelData.value.length === 0) {
		await loadTopLevel()
	}
	
	// 如果有缓存的地址链数据，现在加载
	if (cachedChainData.value) {
		await loadChainData()
	}
	
	tempSelectedItems.value = [...selectedItems.value]
	// 始终从第一个tab开始，让用户看到已选内容
	currentTabIndex.value = 0
	showPopup.value = true
}

// 切换tab
function switchTab(index: number) {
	currentTabIndex.value = index
}

// 选择地址项
async function selectItem(item: AddressItem) {
	const levelIndex = currentTabIndex.value
	
	// 更新选中项
	tempSelectedItems.value = tempSelectedItems.value.slice(0, levelIndex)
	tempSelectedItems.value.push(item)
	
	// 清除后续层级数据
	levelData.value = levelData.value.slice(0, levelIndex + 1)
	
	// 如果还没到最大层级，加载下一级
	if (levelIndex + 1 < props.maxLevel) {
		try {
			loading.value = true
			const childData = await listAddressesByParent(item.id)
			if (childData && childData.length > 0) {
				levelData.value[levelIndex + 1] = childData.map((addr: AddressVO) => ({
					id: addr.id,
					name: addr.name,
					level: addr.level
				}))
				currentTabIndex.value = levelIndex + 1
			} else {
				// 没有下级了，自动确认（如果满足最小层级要求）
				if (tempSelectedItems.value.length >= props.minLevel) {
					confirmSelection()
				}
			}
		} catch (error) {
			console.error('加载子级地址失败:', error)
		} finally {
			loading.value = false
		}
	} else {
		// 达到最大层级，自动确认
		confirmSelection()
	}
}

// 确认选择
function confirmSelection() {
	if (!canConfirm.value) {
		uni.showToast({
			title: `请至少选择${props.minLevel}级地址`,
			icon: 'none'
		})
		return
	}
	
	selectedItems.value = [...tempSelectedItems.value]
	const lastItem = selectedItems.value[selectedItems.value.length - 1]
	
	emit('update:modelValue', lastItem?.id || null)
	emit('change', lastItem?.id || null, [...selectedItems.value])
	
	showPopup.value = false
}

// 关闭弹出层
function closePopup() {
	showPopup.value = false
}

// 清空选择
function clearSelection() {
	selectedItems.value = []
	tempSelectedItems.value = []
	currentTabIndex.value = 0
	emit('update:modelValue', null)
	emit('change', null, [])
}

// 判断当前项是否选中
function isSelected(item: AddressItem): boolean {
	const selected = tempSelectedItems.value[currentTabIndex.value]
	return selected?.id === item.id
}
</script>

<template>
	<view class="address-selector">
		<!-- 触发器 -->
		<view 
			class="selector-trigger" 
			:class="{ disabled: disabled, 'has-label': label }"
			@tap="openPicker"
		>
			<view class="trigger-label" v-if="label">
        <text v-if="required" class="required-mark">*</text>
				{{ label }}
			</view>
			<view class="trigger-input">
				<text v-if="displayText" class="trigger-value">{{ displayText }}</text>
				<text v-else class="trigger-placeholder">{{ placeholder }}</text>
				<wd-icon name="arrow-right" size="32rpx" color="#c0c4cc" />
			</view>
		</view>

		<!-- 弹出层 -->
		<wd-popup 
			v-model="showPopup" 
			position="bottom" 
			:safe-area-inset-bottom="true"
			custom-style="border-radius: 24rpx 24rpx 0 0;"
			@close="closePopup"
		>
			<view class="popup-content">
				<!-- 头部 -->
				<view class="popup-header">
					<view class="header-cancel" @tap="closePopup">取消</view>
					<view class="header-title">选择地址</view>
					<view 
						class="header-confirm" 
						:class="{ disabled: !canConfirm }"
						@tap="confirmSelection"
					>
						确定
					</view>
				</view>

				<!-- Tab 切换 -->
				<scroll-view class="tabs-wrapper" scroll-x>
					<view class="tabs">
						<view 
							v-for="tab in availableTabs" 
							:key="tab.index"
							class="tab-item"
							:class="{ active: currentTabIndex === tab.index }"
							@tap="switchTab(tab.index)"
						>
							{{ tab.label }}
						</view>
					</view>
				</scroll-view>

				<!-- 地址列表 -->
				<scroll-view class="address-list" scroll-y>
					<view v-if="loading" class="loading-wrapper">
						<wd-loading />
					</view>
					<view v-else-if="currentLevelList.length === 0" class="empty-wrapper">
						<text>暂无数据</text>
					</view>
					<view v-else>
						<view 
							v-for="item in currentLevelList" 
							:key="item.id"
							class="address-item"
							:class="{ selected: isSelected(item) }"
							@tap="selectItem(item)"
						>
							<text class="item-name">{{ item.name }}</text>
							<wd-icon 
								v-if="isSelected(item)" 
								name="check" 
								size="36rpx" 
								color="#10B981" 
							/>
						</view>
					</view>
				</scroll-view>
			</view>
		</wd-popup>
	</view>
</template>

<style lang="scss" scoped>
.address-selector {
	width: 100%;
}

.selector-trigger {
	display: flex;
	align-items: center;
	min-height: 48px;
	padding: 5px 0;
	
	&.disabled {
		opacity: 0.6;
		pointer-events: none;
	}
	
	// 没有标签时，输入框占满
	&:not(.has-label) {
		.trigger-input {
			flex: 1;
		}
	}
}

.trigger-label {
	font-size: 14px;
	color: rgba(0, 0, 0, 0.85);
	width: var(--wot-input-cell-label-width, 33%);
	margin-right: var(--wot-cell-padding, 15px);
	flex-shrink: 0;
	box-sizing: border-box;
}

.required-mark {
  font-size: 18px;
	color: $color-danger;
	margin-left: 4rpx;
}

.trigger-input {
	flex: 1;
	min-width: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8rpx;
	overflow: hidden;
}

.trigger-value {
	font-size: 14px;
	color: rgba(0, 0, 0, 0.85);
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.trigger-placeholder {
	font-size: 14px;
	color: rgba(0, 0, 0, 0.25);
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.popup-content {
	background: $color-white;
	max-height: 70vh;
	display: flex;
	flex-direction: column;
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 32rpx;
	border-bottom: 2rpx solid #f0f0f0;
}

.header-cancel {
	font-size: $font-size-content;
	color: $color-text-regular;
	padding: 8rpx 16rpx;
}

.header-title {
	font-size: $font-size-title;
	font-weight: 600;
	color: $color-text-primary;
}

.header-confirm {
	font-size: $font-size-content;
	color: $color-success;
	font-weight: 500;
	padding: 8rpx 16rpx;
	
	&.disabled {
		color: $color-border;
	}
}

.tabs-wrapper {
	flex-shrink: 0;
	white-space: nowrap;
	border-bottom: 2rpx solid #f0f0f0;
}

.tabs {
	display: inline-flex;
	padding: 0 24rpx;
}

.tab-item {
	padding: 24rpx 32rpx;
	font-size: $font-size-content;
	color: $color-text-regular;
	position: relative;
	flex-shrink: 0;
	
	&.active {
		color: $color-success;
		font-weight: 500;
		
		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 48rpx;
			height: 4rpx;
			background: $color-success;
			border-radius: 2rpx;
		}
	}
}

.address-list {
	flex: 1;
	min-height: 400rpx;
	max-height: 50vh;
}

.loading-wrapper,
.empty-wrapper {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 80rpx 0;
	color: $color-text-secondary;
	font-size: $font-size-content;
}

.address-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 32rpx;
	border-bottom: 2rpx solid #f5f5f5;
	
	&:active {
		background: $color-bg-light;
	}
	
	&.selected {
		background: rgba(16, 185, 129, 0.05);
	}
}

.item-name {
	font-size: $font-size-content;
	color: $color-text-primary;
}

.address-item.selected .item-name {
	color: $color-success;
	font-weight: 500;
}
</style>