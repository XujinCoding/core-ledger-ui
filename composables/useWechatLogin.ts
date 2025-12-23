/**
 * 微信登录 Composable
 * @author Core Ledger Team
 * @since 1.0.0
 */

import { ref } from 'vue'
import { wechatLogin } from '@/api/modules/auth'
import type { LoginVO, UserInfoVO } from '@/types/auth'
import type { IdentityType } from '@/enums'

/**
 * 获取微信登录 code
 */
export const getWechatCode = async (): Promise<string> => {
  const loginRes = await new Promise<any>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res: any) => {
        console.log('[Login] 微信登录成功:', res)
        resolve(res)
      },
      fail: (err: any) => {
        console.error('[Login] 微信登录失败:', err)
        reject(new Error('微信登录失败，请检查微信配置'))
      }
    })
  })

  const code = loginRes.code

  if (!code) {
    throw new Error('获取微信登录凭证失败')
  }

  console.log('[Login] 获取到微信 code')
  return code
}

/**
 * 微信登录 Composable
 */
export const useWechatLogin = () => {
  const loading = ref<boolean>(false)
  const error = ref<string>('')

  /**
   * 执行微信登录
   */
  const handleWechatLogin = async (identityType: IdentityType): Promise<LoginVO | null> => {
    try {
      loading.value = true
      error.value = ''

      // 1. 调用微信登录获取 code
      console.log('[Login] 开始微信登录，身份类型:', identityType)
      
      const code = await getWechatCode()

      console.log('[Login] 准备调用后端接口')

      // 2. 调用后端登录接口
      const response = await wechatLogin({
        code,
        identityType
      })

      console.log('[Login] 后端登录接口返回:', response)
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请重试'
      error.value = message
      console.error('[Login] 登录出错:', err)
      uni.showToast({
        title: message,
        icon: 'error',
        duration: 2000
      })
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 处理登录响应
   */
  const handleLoginResponse = async (response: LoginVO | null) => {
    if (!response) return

    // 第一步：检查是否需要选择身份（多商户/多客户场景，临时token）
    if (response.needSelect && response.token) {
      // 保存临时token，用于调用切换身份接口
      uni.setStorageSync('ACCESS_TOKEN', response.token)
      
      if (response.merchants && response.merchants.length > 0) {
        // 有商户列表，显示商户选择页面
        uni.navigateTo({
          url: '/pages/login/select-merchant',
          success: (res) => {
            res.eventChannel.emit('merchantsData', {
              merchants: response.merchants,
              userInfo: response.userInfo
            })
          }
        })
        return
      }

      if (response.customers && response.customers.length > 0) {
        // 有客户列表，显示客户选择页面
        uni.navigateTo({
          url: '/pages/login/select-customer',
          success: (res) => {
            res.eventChannel.emit('customersData', {
              customers: response.customers,
              userInfo: response.userInfo
            })
          }
        })
        return
      }
    }

    // 第二步：检查是否有正式token（认证成功的标志）
    if (response.token && !response.needSelect) {
      // 认证成功，直接进入首页
      uni.setStorageSync('ACCESS_TOKEN', response.token)
      uni.setStorageSync('USER_INFO', JSON.stringify(response.userInfo))
      uni.setStorageSync('IDENTITY_TYPE', response.userInfo.identityType)
      if (response.userInfo.identityType === 1) {
        uni.reLaunch({
          url: '/pages/merchant/index'
        })
      } else if (response.userInfo.identityType === 2) {
        uni.reLaunch({
          url: '/pages/customer/index'
        })
      }
      return
    }

    // 第三步：没有 token，检查是否需要注册
    if (response.needRegister) {
      // 需要注册，根据 registerType 跳转到对应的注册页面
      if (response.registerType === 1) {
        uni.navigateTo({
          url: '/pages/register/merchant'
        })
      } else if (response.registerType === 2) {
        uni.navigateTo({
          url: '/pages/register/customer'
        })
      }
      return
    }

    // 如果都没有，说明出现异常
    uni.showModal({
      title: '登录失败',
      content: '登录失败，请重试',
      showCancel: false
    })
  }

  return {
    loading,
    error,
    handleWechatLogin,
    handleLoginResponse
  }
}
