/**
 * 导入功能组件
 * 提供书签数据导入功能的用户界面
 * 支持 AI 智能整理
 * 
 * 流程:
 * 1. upload: 选择格式 → 上传文件 → 验证 → 解析 → 选择是否启用 AI
 * 2. ai-organize: 输入 API Key → 配置选项 → 执行整理
 * 3. ai-preview: 预览对比 → 手动调整 → 确认导入
 */

import { useState, useEffect } from 'react'
import {
  Upload,
  FileText,
  Code,
  CheckCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DragDropUpload } from '../common/DragDropUpload'
import { ProgressIndicator } from '../common/ProgressIndicator'
import { ErrorDisplay } from '../common/ErrorDisplay'
import { useImportState } from './hooks/useImportState'
import { useImportActions, formatFileSize } from './hooks/useImportActions'
import { AiOrganizeStep } from './AiOrganizeStep'
import { AiPreviewStep } from './AiPreviewStep'
import { parseBookmarksFile } from '@/lib/import/html-parser'
import { useAuthStore } from '@/stores/authStore'
import type { ImportFormat, ImportResult, ParsedBookmark } from '@shared/import-export-types'
import type { OrganizeResult, OrganizedBookmark } from '@/lib/ai/organize'

interface ImportSectionProps {
  onImport?: (result: ImportResult) => void
}

// 格式选项
const formatOptions = [
  {
    value: 'html' as ImportFormat,
    label: 'HTML',
    description: '浏览器导出的书签文件',
    icon: FileText,
    extensions: ['.html', '.htm']
  },
  {
    value: 'json' as ImportFormat,
    label: 'JSON',
    description: 'TMarks 标准格式',
    icon: Code,
    extensions: ['.json']
  }
]

// 步骤类型
type ImportStep = 'upload' | 'ai-organize' | 'ai-preview'

export function ImportSection({ onImport }: ImportSectionProps) {
  const navigate = useNavigate()

  // 当前步骤
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload')

  // 解析后的书签（用于 AI 整理）
  const [parsedBookmarks, setParsedBookmarks] = useState<ParsedBookmark[]>([])

  // AI 整理结果
  const [organizeResult, setOrganizeResult] = useState<OrganizeResult | null>(null)

  // 是否启用 AI 整理
  const [enableAiOrganize, setEnableAiOrganize] = useState(false)

  // 状态管理
  const state = useImportState()
  const {
    selectedFormat,
    setSelectedFormat,
    selectedFile,
    isImporting,
    setIsImporting,
    isValidating,
    importProgress,
    setImportProgress,
    importResult,
    setImportResult,
    validationResult,
    options,
    setOptions,
    fileInputRef
  } = state

  // 操作逻辑
  const actions = useImportActions({
    selectedFormat,
    setSelectedFile: state.setSelectedFile,
    setImportResult: state.setImportResult,
    setIsValidating: state.setIsValidating,
    setValidationResult: state.setValidationResult,
    setIsImporting: state.setIsImporting,
    setImportProgress: state.setImportProgress,
    fileInputRef,
    options,
    onImport
  })

  const { handleFileSelect, handleImport, handleReset } = actions

  // 当文件验证通过后，解析书签
  useEffect(() => {
    async function parseFile() {
      if (selectedFile && validationResult?.valid) {
        try {
          const content = await selectedFile.text()
          const bookmarks = parseBookmarksFile(content, selectedFormat as 'html' | 'json')
          setParsedBookmarks(bookmarks)
        } catch (err) {
          console.error('Failed to parse bookmarks:', err)
          setParsedBookmarks([])
        }
      } else {
        setParsedBookmarks([])
      }
    }
    parseFile()
  }, [selectedFile, validationResult, selectedFormat])

  // 处理 AI 整理完成 - 进入预览步骤
  const handleAiOrganizeComplete = (result: OrganizeResult) => {
    setOrganizeResult(result)
    setCurrentStep('ai-preview')
  }

  // 使用 AI 标签导入（从预览页面确认）
  const handleImportWithAiTags = async (bookmarks: OrganizedBookmark[]) => {
    setIsImporting(true)
    setImportProgress({ current: 0, total: 100, status: '准备导入...' })

    try {
      // 构建导入数据，使用 AI 生成的标签
      const importData = {
        format: 'json' as const,
        content: JSON.stringify({
          version: '1.0.0',
          exported_at: new Date().toISOString(),
          bookmarks: bookmarks.map((b) => ({
            title: b.title,
            url: b.url,
            description: b.ai_description || b.description,
            tags: b.ai_tags?.length ? b.ai_tags : b.tags,
            created_at: b.created_at
          })),
          tags: []
        }),
        options
      }

      const token = useAuthStore.getState().accessToken
      const response = await fetch('/api/v1/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(importData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Import failed')
      }

      const result: ImportResult = await response.json()
      setImportResult(result)
      onImport?.(result)
    } catch (error) {
      console.error('Import failed:', error)
      setImportResult({
        success: 0,
        failed: 1,
        skipped: 0,
        total: 1,
        errors: [
          {
            index: 0,
            item: { title: '', url: '', tags: [] },
            error: error instanceof Error ? error.message : '未知错误',
            code: 'UNKNOWN_ERROR'
          }
        ],
        created_bookmarks: [],
        created_tags: [],
        created_tab_groups: [],
        tab_groups_success: 0,
        tab_groups_failed: 0
      })
    } finally {
      setIsImporting(false)
      setImportProgress(null)
    }
  }

  // 跳过 AI 整理，直接导入原始文件
  const handleSkipAiOrganize = () => {
    if (selectedFile) {
      handleImport(selectedFile)
    }
  }

  // 从预览返回 AI 整理步骤
  const handleBackToOrganize = () => {
    setCurrentStep('ai-organize')
  }

  // 放弃 AI 整理结果，直接导入原始文件
  const handleSkipAiResult = () => {
    if (selectedFile) {
      handleImport(selectedFile)
    }
  }

  // 重置所有状态
  const handleFullReset = () => {
    handleReset()
    setCurrentStep('upload')
    setParsedBookmarks([])
    setOrganizeResult(null)
    setEnableAiOrganize(false)
  }

  // 渲染上传步骤
  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* AI 整理开关 - 始终显示在最前面 */}
      <div className={`p-4 rounded-lg border ${enableAiOrganize ? 'bg-primary/10 border-primary' : 'bg-primary/5 border-primary/20'}`}>
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enableAiOrganize ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">✨ 启用 AI 智能整理</div>
              <div className="text-xs text-muted-foreground">
                {selectedFile && validationResult?.valid
                  ? (parsedBookmarks.length > 0 
                      ? `已解析 ${parsedBookmarks.length} 个书签，AI 自动生成标签和描述`
                      : '解析书签中...')
                  : '上传文件后，AI 将自动生成标签和描述'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{enableAiOrganize ? '已启用' : '未启用'}</span>
            <input
              type="checkbox"
              checked={enableAiOrganize}
              onChange={(e) => setEnableAiOrganize(e.target.checked)}
              className="w-5 h-5 text-primary border-border rounded focus:ring-primary"
            />
          </div>
        </label>
      </div>

      {/* 格式选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">选择格式</label>
        <div className="grid grid-cols-2 gap-3">
          {formatOptions.map((format) => {
            const Icon = format.icon
            return (
              <div
                key={format.value}
                className={`relative rounded-lg border p-3 cursor-pointer transition-all touch-manipulation ${
                  selectedFormat === format.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
                onClick={() => setSelectedFormat(format.value)}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground text-sm">{format.label}</div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {format.extensions.join(', ')}
                    </p>
                  </div>
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={selectedFormat === format.value}
                    onChange={() => setSelectedFormat(format.value)}
                    className="h-4 w-4 text-primary border-border focus:ring-primary flex-shrink-0"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 文件选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">选择文件</label>

        <DragDropUpload
          onFileSelect={handleFileSelect}
          accept={formatOptions.find((f) => f.value === selectedFormat)?.extensions.join(',')}
          maxSize={50 * 1024 * 1024}
          disabled={isImporting}
        >
          {selectedFile ? (
            <div className="p-6 text-center">
              <div className="flex flex-col items-center space-y-3">
                {isValidating ? (
                  <>
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <div>
                      <p className="text-lg font-medium text-foreground">正在验证文件...</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-8 w-8 text-success" />
                    <div>
                      <p className="text-lg font-medium text-foreground">文件已选择</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    </div>
                    <button
                      onClick={handleFullReset}
                      className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted"
                    >
                      重新选择
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </DragDropUpload>
      </div>

      {/* 验证结果 */}
      {validationResult && (
        <ErrorDisplay
          errors={validationResult.errors}
          variant={validationResult.valid ? 'success' : 'error'}
          title={validationResult.valid ? '文件验证通过' : '文件验证失败'}
          dismissible={false}
          collapsible={true}
          showDetails={true}
        />
      )}

      {/* 导入选项 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">导入选项</label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.skip_duplicates}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  skip_duplicates: e.target.checked
                }))
              }
              className="h-4 w-4 text-primary border-border rounded focus:ring-primary flex-shrink-0"
            />
            <span className="text-sm text-foreground">跳过重复</span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.create_missing_tags}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  create_missing_tags: e.target.checked
                }))
              }
              className="h-4 w-4 text-primary border-border rounded focus:ring-primary flex-shrink-0"
            />
            <span className="text-sm text-foreground">创建标签</span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.preserve_timestamps}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  preserve_timestamps: e.target.checked
                }))
              }
              className="h-4 w-4 text-primary border-border rounded focus:ring-primary flex-shrink-0"
            />
            <span className="text-sm text-foreground">保留时间</span>
          </label>

          {selectedFormat === 'html' && (
            <label className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={options.folder_as_tag}
                onChange={(e) =>
                  setOptions((prev) => ({
                    ...prev,
                    folder_as_tag: e.target.checked
                  }))
                }
                className="h-4 w-4 text-primary border-border rounded focus:ring-primary flex-shrink-0"
              />
              <span className="text-sm text-foreground">文件夹转标签</span>
            </label>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      {!importResult && (
        <div className="flex space-x-3">
          {enableAiOrganize ? (
            <button
              onClick={() => setCurrentStep('ai-organize')}
              disabled={!selectedFile || !validationResult?.valid || isImporting || isValidating || parsedBookmarks.length === 0}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              <Sparkles className="h-4 w-4" />
              <span>{parsedBookmarks.length === 0 ? '解析中...' : `下一步：AI 整理 (${parsedBookmarks.length} 个书签)`}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => selectedFile && handleImport(selectedFile)}
              disabled={!selectedFile || !validationResult?.valid || isImporting || isValidating}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{isImporting ? '导入中...' : '开始导入'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )

  // 渲染 AI 整理步骤
  const renderAiOrganizeStep = () => (
    <div className="space-y-4">
      {/* 返回按钮 */}
      <button
        onClick={() => setCurrentStep('upload')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        返回上一步
      </button>

      {/* AI 整理组件 */}
      <AiOrganizeStep
        bookmarks={parsedBookmarks}
        existingTags={[]}
        onComplete={handleAiOrganizeComplete}
        onSkip={handleSkipAiOrganize}
      />
    </div>
  )

  // 渲染 AI 预览步骤
  const renderAiPreviewStep = () => {
    if (!organizeResult) return null

    return (
      <div className="space-y-4">
        {/* 返回按钮 */}
        <button
          onClick={handleBackToOrganize}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          返回 AI 整理
        </button>

        {/* 预览组件 */}
        <AiPreviewStep
          result={organizeResult}
          onConfirm={handleImportWithAiTags}
          onBack={handleBackToOrganize}
          onSkip={handleSkipAiResult}
        />
      </div>
    )
  }

  // 渲染导入进度和结果
  const renderImportProgress = () => (
    <div className="space-y-6">
      {/* 导入进度 */}
      {importProgress && (
        <ProgressIndicator
          progress={{
            current: importProgress.current,
            total: importProgress.total,
            percentage: (importProgress.current / importProgress.total) * 100,
            status: importProgress.status,
            message: `正在处理第 ${importProgress.current} / ${importProgress.total} 项`
          }}
          variant="detailed"
          showSpeed={true}
          showETA={true}
        />
      )}

      {/* 导入结果 */}
      {importResult && (
        <div className="bg-muted rounded-lg p-3 sm:p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">导入结果</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-success">{importResult.success}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">成功导入</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-destructive">
                {importResult.failed}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">导入失败</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-warning">{importResult.skipped}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">跳过重复</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-primary">{importResult.total}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">总计处理</div>
            </div>
          </div>

          {importResult.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-muted-foreground">成功率</span>
                <span className="font-medium text-foreground">
                  {Math.round((importResult.success / importResult.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-success h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(importResult.success / importResult.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {importResult.errors.length > 0 && (
            <div className="mt-4">
              <ErrorDisplay
                errors={importResult.errors.map((error) => ({
                  message: error.error,
                  code: error.code,
                  details: `书签: ${error.item.title || error.item.url}`
                }))}
                variant="error"
                title={`导入错误 (${importResult.errors.length})`}
                dismissible={false}
                collapsible={true}
                maxVisible={2}
              />
            </div>
          )}

          {importResult.success > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/bookmarks')}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
              >
                <span>查看导入的书签</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleFullReset}
                className="flex-1 px-4 py-3 sm:py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
              >
                继续导入
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  // 根据当前步骤渲染内容
  if (importResult || importProgress) {
    return renderImportProgress()
  }

  switch (currentStep) {
    case 'ai-organize':
      return renderAiOrganizeStep()
    case 'ai-preview':
      return renderAiPreviewStep()
    case 'upload':
    default:
      return renderUploadStep()
  }
}
