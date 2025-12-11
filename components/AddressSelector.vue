<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { listAddressesByParent, getAddressChain } from '@/api/modules/address'

// 定义 Props
interface Props {
	modelValue?: number[] // 接收父组件传递的已选择地址ID列表
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: () => []
})

// 定义 Emits
const emit = defineEmits<{
	(e: 'update:modelValue', value: number[]): void
	(e: 'change', value: number[]): void
}>()

const value = ref<number[]>([])
const area = ref<any[]>([])

// 初始化加载顶级地址
onMounted(async () => {
	try {
		const data = await listAddressesByParent(0)
		area.value = [
			data.map((item: any) => ({
				value: item.id,
				label: item.name
			}))
		]

		// 如果父组件传递了初始值，进行反显
		if (props.modelValue && props.modelValue.length > 0) {
			await initAddressDisplay()
		}
	} catch (error) {
		console.error('加载地址数据失败:', error)
	}
})

// 监听父组件传递的值变化
watch(() => props.modelValue, async (newVal: number[]) => {
	if (newVal && newVal.length > 0 && JSON.stringify(newVal) !== JSON.stringify(value.value)) {
		await initAddressDisplay()
	}
}, { deep: true })

// 初始化地址反显
async function initAddressDisplay() {
	try {
		// 使用 getAddressChain 获取完整的地址链
		const addressChain = await getAddressChain(props.modelValue[props.modelValue.length - 1])
		
		if (addressChain && addressChain.length > 0) {
			// 重置 area 数组
			area.value = [area.value[0]] // 保留第一级数据
			
			// 依次加载每一级的数据
			for (let i = 0; i < addressChain.length - 1; i++) {
				const childData = await listAddressesByParent(addressChain[i].id)
				if (childData && childData.length > 0) {
					area.value.push(
						childData.map((item: any) => ({
							value: item.id,
							label: item.name
						}))
					)
				}
			}
			
			// 设置选中的值
			value.value = addressChain.map(item => item.id)
		}
	} catch (error) {
		console.error('地址反显失败:', error)
	}
}

// 列变化事件
const columnChange = async ({ selectedItem, resolve, finish, columnIndex }) => {
	try {
		const areaData = await listAddressesByParent(selectedItem.value)
		
		if (areaData && areaData.length > 0) {
			resolve(
				areaData.map((item: any) => ({
					value: item.id,
					label: item.name
				}))
			)
		} else {
			// 没有更多子级，结束选择
			finish()
		}
	} catch (error) {
		console.error('加载子级地址失败:', error)
		finish()
	}
}

// 确认选择
function handleConfirm({ value: selectedValue }) {
	const finalValue = selectedValue || value.value
	
	console.log('选中的地址ID列表:', finalValue)
	
	// 触发 v-model 更新
	emit('update:modelValue', finalValue)
	
	// 触发 change 事件
	emit('change', finalValue)
}
</script>

<template>
	<view class="address-picker-wrapper">
		<wd-col-picker 
			label="地址" 
			title="选择地址" 
			v-model="value" 
			:columns="area" 
			:column-change="columnChange" 
			required
			@confirm="handleConfirm"
		/>
	</view>
</template>

<style scoped>
.address-picker-wrapper {
	width: 100%;
}
</style>