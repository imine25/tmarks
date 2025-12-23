/**
 * AI 整理步骤组件
 */

import { useState } from 'react'
import { Bot, Sparkles, FileText, Settings2, Loader2, AlertCircle, Key, Eye, EyeOff } from 'lucide-react'
import { useAiSettings } from '@/hooks/useAiSettings'
import { useNavigate } from 'react-router-dom'
import {
  organizeBookmarks,
  estimateTokens,
  estimateCost,
  type OrganizeOptions,
  type OrganizeProgress,
  type OrganizeResult
} from '@/lib/ai/organize'
import { AI_PROVIDER_NAMES, AI_DEFAULT_MODELS, type AIProvider } from '@/lib/ai/constants'
import type { ParsedBookmark } from '@shared/import-export-types'

interface AiOrganizeStepProps {
  bookmarks: ParsedBookmark[]
  existingTags?: string[]
  onComplete: (result: OrganizeResult) => void
  onSkip: () => void
}

export function AiOrganizeStep({
  bookmarks,
  existingTags = [],
  onComplete,
  onSkip
}: AiOrganizeStepProps) {
  const navigate = useNavigate()
  const { data: aiSettings, isLoading: isLoadingSettings } = useAiSettings()

  // 整理选项
  const [options, setOptions] = useState<OrganizeOptions>({
    generateTags: true,
    generateDescription: false,
    normalizeTags: true,
    existingTags,
    batchSize: 20
  })

  // 临时 API Key（用于当前会话）
  const [tempApiKey, setTempApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  // 状态
  const [isOrganizing, setIsOrganizing] = useState(false)
  const [progress, setProgress] = useState<OrganizeProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 当前使用的配置
  const provider: AIProvider = aiSettings?.provider || 'openai'
  const model = aiSettings?.model || AI_DEFAULT_MODELS[provider]
  const apiUrl = aiSettings?.api_urls?.[provider]

  // 估算
  const estimatedTokens = estimateTokens(bookmarks, options)
  const estimatedCost = estimateCost(estimatedTokens, provider)

  // 检查是否已配置（有脱敏的 Key 说明已配置过）
  const hasConfigured = aiSettings?.enabled && aiSettings?.api_keys?.[provider]

  // 开始整理
  const handleStartOrganize = async () => {
    if (!tempApiKey) {
      setError('请输入 API Key')
      return
    }

    setIsOrganizing(true)
    setError(null)
    setProgress({ current: 0, total: bookmarks.length, status: 'preparing' })

    try {
      const generator = organizeBookmarks(
        bookmarks,
        {
          provider,
          apiKey: tempApiKey,
          apiUrl,
          model
        },
        options,
        setProgress
      )

      let finalResult: OrganizeResult | undefined

      for await (const p of generator) {
        setProgress(p)
      }

      // 获取最终结果
      const result = await generator.next()
      if (result.done && result.value) {
        finalResult = result.value
      }

      if (finalResult) {
        onComplete(finalResult)
      }

    } catch (err) {
      console.error('AI organize failed:', err)
      setError(err instanceof Error ? err.message : '整理失败')
    } finally {
      setIsOrganizing(false)
    }
  }

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI 智能整理</h3>
          <p className="text-sm text-muted-foreground">
            使用 AI 自动为书签生成标签和描述
          </p>
        </div>
      </div>

      {/* AI 配置状态 */}
      {!hasConfigured ? (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">未配置 AI 服务</p>
              <p className="text-sm text-muted-foreground mt-1">
                请先在设置中配置 AI 服务，或在下方直接输入 API Key
              </p>
              <button
                onClick={() => navigate('/settings')}
                className="mt-2 text-sm text-primary hover:underline"
              >
                前往设置
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {AI_PROVIDER_NAMES[provider]}
              </span>
              {model && (
                <span className="text-xs text-muted-foreground">
                  ({model})
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/settings')}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Settings2 className="w-3 h-3" />
              修改配置
            </button>
          </div>
        </div>
      )}

      {/* API Key 输入（临时使用） */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">API Key</label>
        <p className="text-xs text-muted-foreground">
          为保护安全，请在此输入 API Key（仅用于本次整理，不会保存）
        </p>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Key className="w-4 h-4 text-muted-foreground" />
          </div>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={tempApiKey}
            onChange={(e) => {
              setTempApiKey(e.target.value)
              setError(null)
            }}
            placeholder={`输入 ${AI_PROVIDER_NAMES[provider]} API Key`}
            className="input w-full pl-10 pr-10"
            disabled={isOrganizing}
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

      {/* 整理选项 */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">整理选项</label>
        
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.generateTags}
              onChange={(e) => setOptions(prev => ({ ...prev, generateTags: e.target.checked }))}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">智能生成标签</div>
              <div className="text-xs text-muted-foreground">为每个书签生成 2-5 个相关标签</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.generateDescription}
              onChange={(e) => setOptions(prev => ({ ...prev, generateDescription: e.target.checked }))}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">生成描述</div>
              <div className="text-xs text-muted-foreground">为书签生成简短描述（消耗更多 Token）</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.normalizeTags}
              onChange={(e) => setOptions(prev => ({ ...prev, normalizeTags: e.target.checked }))}
              className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground">标签规范化</div>
              <div className="text-xs text-muted-foreground">优先使用已有标签，统一命名风格</div>
            </div>
          </label>
        </div>
      </div>

      {/* 预估消耗 */}
      <div className="p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">预估消耗</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-foreground">{bookmarks.length}</div>
            <div className="text-xs text-muted-foreground">书签数量</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">
              {estimatedTokens > 1000 
                ? `${(estimatedTokens / 1000).toFixed(1)}k` 
                : estimatedTokens}
            </div>
            <div className="text-xs text-muted-foreground">预估 Token</div>
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">
              ${estimatedCost.toFixed(3)}
            </div>
            <div className="text-xs text-muted-foreground">预估费用</div>
          </div>
        </div>
      </div>

      {/* 进度 */}
      {progress && isOrganizing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{progress.message}</span>
            <span className="text-foreground font-medium">
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <button
          onClick={onSkip}
          disabled={isOrganizing}
          className="flex-1 btn btn-ghost"
        >
          跳过，直接导入
        </button>
        
        <button
          onClick={handleStartOrganize}
          disabled={isOrganizing || !options.generateTags || !tempApiKey}
          className="flex-1 btn btn-primary flex items-center justify-center gap-2"
        >
          {isOrganizing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              整理中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              开始 AI 整理
            </>
          )}
        </button>
      </div>
    </div>
  )
}
