/**
 * AI 设置标签页
 * 配置 AI 服务用于智能导入等功能
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bot, Key, Eye, EyeOff, ExternalLink, Check, X, Loader2, Info, RefreshCw, ChevronDown } from 'lucide-react'
import { useAiSettings, useUpdateAiSettings, useTestAiConnection } from '@/hooks/useAiSettings'
import { useToastStore } from '@/stores/toastStore'
import { InfoBox } from '../InfoBox'
import {
  type AIProvider,
  AI_PROVIDER_NAMES,
  AI_SERVICE_DOCS,
  AI_DEFAULT_MODELS,
  AI_AVAILABLE_MODELS,
  AI_SERVICE_URLS
} from '@/lib/ai/constants'
import { canFetchModels, fetchAvailableModels } from '@/lib/ai/models'

// 服务商列表
const PROVIDERS: AIProvider[] = ['openai', 'claude', 'deepseek', 'zhipu', 'siliconflow', 'custom']

export function AiSettingsTab() {
  const { data: settings, isLoading } = useAiSettings()
  const updateSettings = useUpdateAiSettings()
  const testConnection = useTestAiConnection()
  const { addToast } = useToastStore()

  // 本地状态
  const [provider, setProvider] = useState<AIProvider>('openai')
  const [apiKey, setApiKey] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [model, setModel] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 测试状态
  const [testResult, setTestResult] = useState<{
    success: boolean
    latency?: number
    error?: string
  } | null>(null)

  // 模型获取状态
  const [fetchedModels, setFetchedModels] = useState<string[]>([])
  const [isFetchingModels, setIsFetchingModels] = useState(false)
  const [modelFetchError, setModelFetchError] = useState<string | null>(null)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const lastFetchSignature = useRef<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉框
  useEffect(() => {
    if (!showModelDropdown) return
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModelDropdown])

  // 从服务器加载设置
  useEffect(() => {
    if (settings) {
      setProvider(settings.provider)
      setModel(settings.model || AI_DEFAULT_MODELS[settings.provider])
      setEnabled(settings.enabled)
      // API Key 显示脱敏值
      setApiKey(settings.api_keys[settings.provider] || '')
      // API URL
      setApiUrl(settings.api_urls[settings.provider] || '')
    }
  }, [settings])

  // 切换服务商时更新相关字段
  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider)
    setModel(AI_DEFAULT_MODELS[newProvider])
    setApiKey(settings?.api_keys[newProvider] || '')
    setApiUrl(settings?.api_urls[newProvider] || '')
    setTestResult(null)
    setHasChanges(true)
    // 重置模型获取状态
    setFetchedModels([])
    setModelFetchError(null)
    lastFetchSignature.current = null
  }

  // 自动获取模型列表
  const fetchModels = useCallback(async () => {
    const trimmedKey = apiKey.trim()
    const supported = canFetchModels(provider, apiUrl)
    
    if (!supported || !trimmedKey || trimmedKey.includes('...')) {
      return
    }

    const signature = `${provider}:${trimmedKey}:${apiUrl}`
    if (signature === lastFetchSignature.current) {
      return
    }

    setIsFetchingModels(true)
    setModelFetchError(null)

    try {
      const models = await fetchAvailableModels(provider, trimmedKey, apiUrl)
      setFetchedModels(models)
      lastFetchSignature.current = signature
      
      // 如果当前模型不在列表中，自动选择第一个
      if (models.length > 0 && !models.includes(model)) {
        setModel(models[0] || AI_DEFAULT_MODELS[provider])
        setHasChanges(true)
      }
    } catch (error) {
      setFetchedModels([])
      setModelFetchError(error instanceof Error ? error.message : String(error))
      lastFetchSignature.current = signature
    } finally {
      setIsFetchingModels(false)
    }
  }, [provider, apiKey, apiUrl, model])

  // 当 API Key 或 URL 变化时自动获取模型
  useEffect(() => {
    const trimmedKey = apiKey.trim()
    if (!trimmedKey || trimmedKey.includes('...')) {
      return
    }

    const supported = canFetchModels(provider, apiUrl)
    if (!supported) {
      setFetchedModels([])
      setModelFetchError(null)
      return
    }

    // 延迟获取，避免频繁请求
    const timer = setTimeout(() => {
      fetchModels()
    }, 500)

    return () => clearTimeout(timer)
  }, [provider, apiKey, apiUrl, fetchModels])

  // 手动刷新模型列表
  const handleRefreshModels = () => {
    lastFetchSignature.current = null
    fetchModels()
  }

  // 模型是否支持自动获取
  const modelFetchSupported = canFetchModels(provider, apiUrl)
  
  // 合并模型列表：获取到的模型 + 预设模型
  const allModels = fetchedModels.length > 0 
    ? fetchedModels 
    : AI_AVAILABLE_MODELS[provider]

  // 保存设置
  const handleSave = async () => {
    try {
      const updateData: Record<string, unknown> = {
        provider,
        model,
        enabled
      }

      // 只有当 API Key 不是脱敏值时才更新
      if (apiKey && !apiKey.includes('...')) {
        updateData.api_keys = { [provider]: apiKey }
      }

      // 更新 API URL
      if (apiUrl) {
        updateData.api_urls = { [provider]: apiUrl }
      }

      await updateSettings.mutateAsync(updateData)
      addToast('success', 'AI 设置已保存')
      setHasChanges(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      addToast('error', message)
    }
  }

  // 测试连接
  const handleTest = async () => {
    if (!apiKey || apiKey.includes('...')) {
      addToast('error', '请先输入完整的 API Key')
      return
    }

    setTestResult(null)

    try {
      const result = await testConnection.mutateAsync({
        provider,
        api_key: apiKey,
        api_url: apiUrl || undefined,
        model: model || undefined
      })

      setTestResult({
        success: result.success,
        latency: result.latency_ms,
        error: result.error
      })

      if (result.success) {
        addToast('success', `连接成功 (${result.latency_ms}ms)`)
      } else {
        addToast('error', result.error || '连接失败')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '测试失败'
      setTestResult({ success: false, error: message })
      addToast('error', message)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h3 className="text-lg font-semibold text-foreground">AI 服务配置</h3>
        <p className="text-sm text-muted-foreground mt-1">
          配置 AI 服务用于智能导入、标签推荐等功能
        </p>
      </div>

      {/* 启用开关 */}
      <div className={`flex items-center justify-between p-4 rounded-lg bg-card border-2 transition-colors ${
        enabled ? 'border-primary bg-primary/5' : 'border-border'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            enabled ? 'bg-primary/20' : 'bg-primary/10'
          }`}>
            <Bot className={`w-5 h-5 ${enabled ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground flex items-center gap-2">
              启用 AI 功能
              {enabled && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">已开启</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">开启后可使用 AI 智能整理等功能</div>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              setEnabled(e.target.checked)
              setHasChanges(true)
            }}
            className="sr-only peer"
          />
          <div className={`w-11 h-6 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full ${
            enabled ? 'bg-primary' : 'bg-muted'
          }`}></div>
        </label>
      </div>

      {/* 服务商选择 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">服务商</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              onClick={() => handleProviderChange(p)}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                provider === p
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card text-foreground hover:border-muted-foreground/30'
              }`}
            >
              {AI_PROVIDER_NAMES[p]}
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">API Key</label>
          {AI_SERVICE_DOCS[provider] && (
            <a
              href={AI_SERVICE_DOCS[provider]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              获取 API Key
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Key className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value)
              setHasChanges(true)
              setTestResult(null)
            }}
            placeholder={`输入 ${AI_PROVIDER_NAMES[provider]} API Key`}
            className="input w-full pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 模型选择 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">模型</label>
          {modelFetchSupported && (
            <button
              type="button"
              onClick={handleRefreshModels}
              disabled={isFetchingModels || !apiKey.trim() || apiKey.includes('...')}
              className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                isFetchingModels || !apiKey.trim() || apiKey.includes('...')
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
              {isFetchingModels ? '获取中...' : '刷新模型'}
            </button>
          )}
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={model}
              onChange={(e) => {
                setModel(e.target.value)
                setHasChanges(true)
              }}
              placeholder={AI_DEFAULT_MODELS[provider]}
              className="input flex-1"
            />
            {allModels.length > 0 && (
              <button
                type="button"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="btn btn-ghost px-3 flex items-center gap-1"
              >
                选择
                <ChevronDown className={`w-4 h-4 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
          
          {/* 模型下拉列表 */}
          {showModelDropdown && allModels.length > 0 && (
            <div className="absolute z-10 mt-2 right-0 w-full max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
              {allModels.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setModel(m)
                    setHasChanges(true)
                    setShowModelDropdown(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    model === m
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* 状态提示 */}
        {fetchedModels.length > 0 && (
          <p className="text-xs text-primary">
            已获取 {fetchedModels.length} 个模型，可直接选择或手动输入
          </p>
        )}
        {modelFetchError && (
          <p className="text-xs text-destructive">
            模型列表加载失败：{modelFetchError}
          </p>
        )}
        {!fetchedModels.length && modelFetchSupported && !modelFetchError && !isFetchingModels && (
          <p className="text-xs text-muted-foreground">
            输入 API Key 后可自动获取可用模型列表，推荐使用 {AI_DEFAULT_MODELS[provider]}
          </p>
        )}
        {!modelFetchSupported && (
          <p className="text-xs text-muted-foreground">
            推荐使用 {AI_DEFAULT_MODELS[provider]}，性价比较高
          </p>
        )}
      </div>

      {/* 自定义 API URL（仅 custom 或高级用户） */}
      {(provider === 'custom' || apiUrl) && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            API 地址 {provider !== 'custom' && '(可选)'}
          </label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => {
              setApiUrl(e.target.value)
              setHasChanges(true)
            }}
            placeholder={AI_SERVICE_URLS[provider] || 'https://api.example.com/v1'}
            className="input w-full"
          />
          <p className="text-xs text-muted-foreground">
            留空使用默认地址，或输入自定义 API 端点
          </p>
        </div>
      )}

      {/* 测试连接 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleTest}
          disabled={testConnection.isPending || !apiKey}
          className="btn btn-ghost flex items-center gap-2"
        >
          {testConnection.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
          测试连接
        </button>

        {testResult && (
          <div className={`flex items-center gap-2 text-sm ${
            testResult.success ? 'text-success' : 'text-destructive'
          }`}>
            {testResult.success ? (
              <>
                <Check className="w-4 h-4" />
                连接成功 ({testResult.latency}ms)
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                {testResult.error || '连接失败'}
              </>
            )}
          </div>
        )}
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={updateSettings.isPending || !hasChanges}
          className="btn btn-primary flex items-center gap-2"
        >
          {updateSettings.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          保存设置
        </button>
      </div>

      {/* 提示信息 */}
      <InfoBox icon={Info} title="使用说明" variant="info">
        <ul className="space-y-1 text-sm">
          <li>• API Key 会加密存储在服务器，不会泄露</li>
          <li>• AI 调用直接从浏览器发起，数据不经过 TMarks 服务器</li>
          <li>• 推荐使用 DeepSeek 或 gpt-4o-mini，性价比高</li>
          <li>• 导入 100 个书签约消耗 0.01-0.05 美元</li>
        </ul>
      </InfoBox>
    </div>
  )
}
