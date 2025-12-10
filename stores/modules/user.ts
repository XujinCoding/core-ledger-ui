/**
 * 用户状态管理 Store
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfoVO } from '@/types/auth'
import type { IdentityType } from '@/enums'

/**
 * 用户 Store
 */
export const useUserStore = defineStore('user', () => {
  // ==================== State ====================
  
  /** 访问令牌 */
  const token = ref<string | null>(null)
  
  /** 用户信息 */
  const userInfo = ref<UserInfoVO | null>(null)
  
  /** 身份类型 */
  const identityType = ref<IdentityType | null>(null)

  // ==================== Getters ====================
  
  /** 是否已登录 */
  const isLoggedIn = computed(() => !!token.value)
  
  /** 用户名 */
  const userName = computed(() => userInfo.value?.name || '')
  
  /** 用户手机号 */
  const userPhone = computed(() => userInfo.value?.phone || '')
  
  /** 用户ID */
  const userId = computed(() => userInfo.value?.id || 0)

  // ==================== Actions ====================
  
  /**
   * 设置 token
   */
  const setToken = (newToken: string): void => {
    token.value = newToken
    uni.setStorageSync('ACCESS_TOKEN', newToken)
  }

  /**
   * 设置用户信息
   */
  const setUserInfo = (info: UserInfoVO): void => {
    userInfo.value = info
    uni.setStorageSync('USER_INFO', JSON.stringify(info))
  }

  /**
   * 设置身份类型
   */
  const setIdentityType = (type: IdentityType): void => {
    identityType.value = type
    uni.setStorageSync('IDENTITY_TYPE', type)
  }

  /**
   * 初始化用户信息（从 localStorage 恢复）
   */
  const initializeFromStorage = (): void => {
    const storedToken = uni.getStorageSync('ACCESS_TOKEN')
    const storedUserInfo = uni.getStorageSync('USER_INFO')
    const storedIdentityType = uni.getStorageSync('IDENTITY_TYPE')

    if (storedToken) {
      token.value = storedToken
    }

    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo)
      } catch (error) {
        console.error('[User Store] 解析用户信息失败:', error)
      }
    }

    if (storedIdentityType) {
      identityType.value = storedIdentityType as IdentityType
    }
  }

  /**
   * 登出
   */
  const logout = (): void => {
    token.value = null
    userInfo.value = null
    identityType.value = null
    
    uni.removeStorageSync('ACCESS_TOKEN')
    uni.removeStorageSync('USER_INFO')
    uni.removeStorageSync('IDENTITY_TYPE')
    
    // 重定向到登录页
    uni.reLaunch({
      url: '/pages/login/index'
    })
  }

  /**
   * 清除用户数据（不重定向）
   */
  const clearUserData = (): void => {
    token.value = null
    userInfo.value = null
    identityType.value = null
    
    uni.removeStorageSync('ACCESS_TOKEN')
    uni.removeStorageSync('USER_INFO')
    uni.removeStorageSync('IDENTITY_TYPE')
  }

  return {
    // State
    token,
    userInfo,
    identityType,
    
    // Getters
    isLoggedIn,
    userName,
    userPhone,
    userId,
    
    // Actions
    setToken,
    setUserInfo,
    setIdentityType,
    initializeFromStorage,
    logout,
    clearUserData
  }
})
