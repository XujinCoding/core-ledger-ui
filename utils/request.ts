/**
 * 请求工具封装 (TypeScript版本)
 * 统一处理：Token携带、错误处理、状态码映射、Loading等
 * API层只需关注业务逻辑
 * @author Core Ledger Team
 * @since 1.0.0
 */

// ==================== 类型定义 ====================

/**
 * 请求配置接口
 */
interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  header?: Record<string, string>
  timeout?: number
  showLoading?: boolean
  loadingText?: string
}

/**
 * 响应数据接口（根据后端约定调整）
 */
interface ResponseData<T = any> {
  code: number
  message: string
  data: T
}

/**
 * 错误响应接口
 */
interface ErrorResponse {
  code: number
  message: string
  data: any
  error?: any
}

/**
 * 上传配置接口
 */
interface UploadOptions {
  name?: string
  formData?: Record<string, any>
  header?: Record<string, string>
}

/**
 * HTTP状态码映射类型
 */
type HttpCodeMap = Record<number, string>

/**
 * 业务状态码映射类型
 */
type BusinessCodeMap = Record<number, string>

// ==================== 配置 ====================

const CONFIG = {
  // baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  baseURL: 'http://10.0.63.247:8080/code-ledger/api',
  // baseURL: 'http://82.157.123.96:8080/code-ledger/api',
  timeout: 30000,
  tokenKey: 'ACCESS_TOKEN',
  
  // 不需要token的接口白名单
  noAuthUrls: ['/login', '/register', '/captcha', '/refresh-token']
} as const

// HTTP状态码映射
const HTTP_CODE_MAP: HttpCodeMap = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '没有权限访问',
  404: '请求的资源不存在',
  405: '请求方法不允许',
  408: '请求超时',
  500: '服务器错误',
  502: '网关错误',
  503: '服务暂时不可用',
  504: '网关超时'
}

// 业务状态码映射（根据后端约定修改）
const BUSINESS_CODE_MAP: BusinessCodeMap = {
  0: '操作成功',
  200: '操作成功',
  400: '请求参数错误',
  401: '登录已过期',
  403: '无权限',
  404: '资源不存在',
  500: '服务器错误',
  1001: '用户名或密码错误',
  1002: '账号已被禁用',
  1003: '验证码错误',
  2001: '商品库存不足',
  2002: '订单不存在',
  3001: '余额不足'
}

// ==================== 工具函数 ====================

/**
 * 判断是否需要添加Token
 */
function needAuth(url: string): boolean {
  return !CONFIG.noAuthUrls.some(item => url.includes(item))
}

/**
 * 生成请求ID（用于日志追踪）
 */
function generateRequestId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/**
 * 处理HTTP错误
 */
function handleHttpError(statusCode: number, url: string): void {
  const message = HTTP_CODE_MAP[statusCode] || '网络请求失败'
  
  console.error(`[HTTP Error ${statusCode}]`, url, message)
  
  // 401跳转登录
  if (statusCode === 401) {
    uni.removeStorageSync(CONFIG.tokenKey)
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 2000,
      success: () => {
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/login/index' })
        }, 2000)
      }
    })
    return
  }
  
  // 其他错误提示
  uni.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 处理业务错误
 * @param code 业务状态码
 * @param message 后端返回的错误消息（优先使用）
 * @param url 请求地址
 */
function handleBusinessError(code: number, message: string, url: string): void {
  // 优先使用后端返回的 message，其次使用预定义的映射，最后使用默认提示
  const errorMsg = message || BUSINESS_CODE_MAP[code] || '操作失败'
  
  console.error(`[Business Error ${code}]`, url, errorMsg)
  
  // 业务码401也需要跳转登录
  if (code === 401) {
    uni.removeStorageSync(CONFIG.tokenKey)
    uni.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 2000,
      success: () => {
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/login/index' })
        }, 2000)
      }
    })
    return
  }
  
  // 显示后端返回的错误提示
  uni.showToast({
    title: errorMsg,
    icon: 'none',
    duration: 2000
  })
}

// ==================== 请求拦截器 ====================

/**
 * 请求拦截
 */
function requestInterceptor(config: RequestConfig): RequestConfig {
  // 添加Token
  if (needAuth(config.url)) {
    const token = uni.getStorageSync(CONFIG.tokenKey)
    if (token) {
      config.header = config.header || {}
      config.header['Authorization'] = `Bearer ${token}`
    }
  }
  
  // 添加请求头
  config.header = config.header || {}
  config.header['Content-Type'] = config.header['Content-Type'] || 'application/json'
  config.header['X-Request-ID'] = generateRequestId()
  
  // GET请求添加时间戳防止缓存
  if (config.method === 'GET') {
    const params: Record<string, any> = { ...(config.data || {}) }
    Object.keys(params).forEach((k) => {
      const v = params[k]
      if (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) {
        delete params[k]
      }
    })
    params._t = Date.now()
    config.data = params
  }
  
  // 开发环境打印请求日志
  if (import.meta.env.DEV) {
    console.log('[Request]', config.method, config.url, config.data)
  }
  
  return config
}

/**
 * 响应拦截
 */
function responseInterceptor<T = any>(
  response: UniApp.RequestSuccessCallbackResult,
  originalConfig: RequestConfig
): Promise<T> {
  const { statusCode, data } = response
  const { url } = originalConfig
  
  // 开发环境打印响应日志
  if (import.meta.env.DEV) {
    console.log('[Response]', url, data)
  }
  
  // HTTP状态码非200
  if (statusCode !== 200) {
    handleHttpError(statusCode, url)
    return Promise.reject({
      code: statusCode,
      message: HTTP_CODE_MAP[statusCode] || '请求失败',
      data: null
    } as ErrorResponse)
  }
  
  // 根据后端返回格式处理（根据实际情况调整）
  const responseData = data as ResponseData<T>
  const { code, message, data: result } = responseData
  
  // 业务状态码判断（0和200都表示成功）
  if (code === 0 || code === 200) {
    return Promise.resolve(result)
  }
  
  // 业务错误处理
  // 注意：message 参数优先使用后端返回的错误消息
  handleBusinessError(code, message, url)
  
  // 错误消息优先级：后端message > 预定义映射 > 默认提示
  const errorMsg = message || BUSINESS_CODE_MAP[code] || '操作失败'
  
  return Promise.reject({
    code,
    message: errorMsg,
    data: result
  } as ErrorResponse)
}

// ==================== 请求类 ====================

class Request {
  /**
   * 通用请求方法
   */
  request<T = any>(options: RequestConfig): Promise<T> {
    // 构建完整配置
    const config: RequestConfig = {
      url: CONFIG.baseURL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: options.header || {},
      timeout: options.timeout || CONFIG.timeout,
      showLoading: options.showLoading || false,
      loadingText: options.loadingText || '加载中...'
    }
    
    // 显示Loading
    if (config.showLoading) {
      uni.showLoading({
        title: config.loadingText!,
        mask: true
      })
    }
    
    // 请求拦截
    const interceptedConfig = requestInterceptor(config)
    
    return new Promise<T>((resolve, reject) => {
      uni.request({
        url: interceptedConfig.url,
        method: interceptedConfig.method,
        data: interceptedConfig.data,
        header: interceptedConfig.header,
        timeout: interceptedConfig.timeout,
        success: (res: UniApp.RequestSuccessCallbackResult) => {
          // 隐藏Loading
          if (config.showLoading) {
            uni.hideLoading()
          }
          
          // 响应拦截
          responseInterceptor<T>(res, config)
            .then(resolve)
            .catch(reject)
        },
        fail: (err: UniApp.GeneralCallbackResult) => {
          // 隐藏Loading
          if (config.showLoading) {
            uni.hideLoading()
          }
          
          console.error('[Request Fail]', config.url, err)
          
          // 网络错误提示
          uni.showToast({
            title: '网络请求失败，请检查网络',
            icon: 'none',
            duration: 2000
          })
          
          reject({
            code: -1,
            message: '网络请求失败',
            data: null,
            error: err
          } as ErrorResponse)
        }
      })
    })
  }
  
  /**
   * GET请求
   */
  get<T = any>(url: string, params?: any, options?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      url,
      method: 'GET',
      data: params,
      ...options
    })
  }
  
  /**
   * POST请求
   */
  post<T = any>(url: string, data?: any, options?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      url,
      method: 'POST',
      data,
      ...options
    })
  }
  
  /**
   * PUT请求
   */
  put<T = any>(url: string, data?: any, options?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }
  
  /**
   * DELETE请求
   */
  delete<T = any>(url: string, params?: any, options?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      url,
      method: 'DELETE',
      data: params,
      ...options
    })
  }
  
  /**
   * PATCH请求
   */
  patch<T = any>(url: string, data?: any, options?: Partial<RequestConfig>): Promise<T> {
    return this.request<T>({
      url,
      method: 'PATCH',
      data,
      ...options
    })
  }
  
  /**
   * 文件上传
   */
  upload<T = any>(url: string, filePath: string, options: UploadOptions = {}): Promise<T> {
    const token = uni.getStorageSync(CONFIG.tokenKey)
    
    return new Promise<T>((resolve, reject) => {
      uni.uploadFile({
        url: CONFIG.baseURL + url,
        filePath,
        name: options.name || 'file',
        formData: options.formData || {},
        header: {
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.header
        },
        success: (res: UniApp.UploadFileSuccessCallbackResult) => {
          try {
            const data = JSON.parse(res.data) as ResponseData<T>
            if (data.code === 0 || data.code === 200) {
              resolve(data.data)
            } else {
              handleBusinessError(data.code, data.message, url)
              reject({
                code: data.code,
                message: data.message,
                data: data.data
              } as ErrorResponse)
            }
          } catch (error) {
            uni.showToast({
              title: '响应数据解析失败',
              icon: 'none'
            })
            reject({
              code: -1,
              message: '响应数据解析失败',
              data: null,
              error
            } as ErrorResponse)
          }
        },
        fail: (err: UniApp.GeneralCallbackResult) => {
          uni.showToast({
            title: '上传失败',
            icon: 'none'
          })
          reject({
            code: -1,
            message: '上传失败',
            data: null,
            error: err
          } as ErrorResponse)
        }
      })
    })
  }
}

// 导出单例
const request = new Request()
export default request

// 导出 baseURL 获取函数
export const getBaseUrl = () => CONFIG.baseURL

// 同时导出类型供外部使用
export type { 
  RequestConfig, 
  ResponseData, 
  ErrorResponse, 
  UploadOptions,
  HttpCodeMap,
  BusinessCodeMap
}