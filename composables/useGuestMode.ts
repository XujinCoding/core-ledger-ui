/**
 * 游客模式操作限制 Composable
 * @author Core Ledger Team
 * @since 1.0.0
 */

/**
 * 处理游客模式下的写操作限制
 * 当用户尝试执行需要登录的操作时，弹出提示并引导登录
 * 
 * @param actionName 操作名称，如"添加客户"、"编辑商品"等
 */
export const handleGuestAction = (actionName: string) => {
  uni.showModal({
    title: '需要登录',
    content: `游客模式下无法修改数据，请登录后使用`,
    confirmText: '立即登录',
    cancelText: '取消',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({ url: '/pages/login/index' })
      }
    }
  })
}

/**
 * 使用游客模式限制
 * 返回统一的操作拦截函数
 */
export const useGuestMode = () => {
  return {
    handleGuestAction
  }
}
