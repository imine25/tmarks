/**
 * 上传步骤组件
 */

import { Upload, FileText, Code, CheckCircle, Loader2, Sparkles } from 'lucide-react'
import type { ImportFormat, ImportOptions } from '@/types/import'
import type { NormalizeResult, NormalizeProgress } from '@/lib/import/normalizer'

interface UploadStepProps {
  selectedFormat: ImportFormat
  setSelectedFormat: (format: ImportFormat) => void
  selectedFile: File | null
  isValidating: boolean
  normalizeResult: NormalizeResult | null
  normalizeProgress: NormalizeProgress | null
  enableAiOrganize: boolean
  setEnableAiOrganize: (enable: boolean) => void
  isAiRequired: boolean // HTML格式必须使用AI
  options: ImportOptions
  setOptions: (options: ImportOptions) => void
  onFileSelect: (file: File) => void
  onReset: () => void
  onStartImport: () => void
}

export function UploadStep({
  selectedFormat,
  setSelectedFormat,
  selectedFile,
  isValidating,
  normalizeResult,
  normalizeProgress,
  enableAiOrganize,
  setEnableAiOrganize,
  isAiRequired,
  options,
  setOptions,
  onFileSelect,
  onReset,
  onStartImport
}: UploadStepProps) {
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const formatOptions = [
    {
      value: 'html' as ImportFormat,
      label: chrome.i18n.getMessage('import_format_html'),
      description: chrome.i18n.getMessage('import_format_browser'),
      icon: FileText
    },
    {
      value: 'json' as ImportFormat,
      label: chrome.i18n.getMessage('import_format_json'),
      description: chrome.i18n.getMessage('import_format_tmarks'),
      icon: Code
    }
  ]

  return (
    <div className="space-y-6">
      {/* AI 整理开关 */}
      <div className={`p-4 rounded-lg border ${enableAiOrganize ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'} ${isAiRequired ? 'opacity-75' : ''}`}>
        <label className={`flex items-center justify-between ${isAiRequired ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${enableAiOrganize ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium">
                {chrome.i18n.getMessage('import_enable_ai')}
                {isAiRequired && <span className="ml-2 text-xs text-orange-600">(HTML格式必需)</span>}
              </div>
              <div className="text-xs text-gray-600">
                {isAiRequired 
                  ? 'HTML格式书签没有标签信息，必须使用AI生成标签'
                  : selectedFile && normalizeResult
                    ? `已提取 ${normalizeResult.validUrls.length} 个有效 URL`
                    : chrome.i18n.getMessage('import_ai_hint')
                }
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={enableAiOrganize}
            onChange={(e) => setEnableAiOrganize(e.target.checked)}
            disabled={isAiRequired}
            className="w-5 h-5 disabled:cursor-not-allowed"
          />
        </label>
      </div>

      {/* 格式选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">{chrome.i18n.getMessage('import_select_format')}</label>
        <div className="grid grid-cols-2 gap-3">
          {formatOptions.map((format) => {
            const Icon = format.icon
            return (
              <div
                key={format.value}
                className={`relative rounded-lg border p-3 cursor-pointer ${
                  selectedFormat === format.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedFormat(format.value)}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{format.label}</div>
                    <p className="text-xs text-gray-600 mt-0.5">{format.description}</p>
                  </div>
                  <input
                    type="radio"
                    checked={selectedFormat === format.value}
                    onChange={() => setSelectedFormat(format.value)}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 文件选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">{chrome.i18n.getMessage('import_select_file')}</label>
        
        {selectedFile ? (
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
            {isValidating || normalizeProgress ? (
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                <div className="w-full">
                  <p className="text-lg font-medium">
                    {normalizeProgress ? normalizeProgress.status : chrome.i18n.getMessage('import_validating')}
                  </p>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  
                  {normalizeProgress && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(normalizeProgress.current / normalizeProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {normalizeProgress.current} / {normalizeProgress.total}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="text-center">
                  <p className="text-lg font-medium">{chrome.i18n.getMessage('import_file_selected')}</p>
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                  
                  {normalizeResult && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-gray-600">原始书签：</span>
                          <span className="font-medium">{normalizeResult.stats.total}</span>
                        </div>
                        <div>
                          <span className="text-green-600">有效 URL：</span>
                          <span className="font-medium text-green-600">{normalizeResult.stats.valid}</span>
                        </div>
                        {normalizeResult.stats.duplicates > 0 && (
                          <div>
                            <span className="text-gray-600">去重：</span>
                            <span className="font-medium">{normalizeResult.stats.duplicates}</span>
                          </div>
                        )}
                        {normalizeResult.stats.invalid > 0 && (
                          <div>
                            <span className="text-red-600">无效：</span>
                            <span className="font-medium text-red-600">{normalizeResult.stats.invalid}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* URL 列表预览 */}
                      {normalizeResult.validUrls.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-300">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-700">URL 列表预览</span>
                            <button
                              onClick={() => {
                                const text = normalizeResult.validUrls.join('\n')
                                navigator.clipboard.writeText(text)
                                alert('已复制到剪贴板')
                              }}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              复制全部
                            </button>
                          </div>
                          <div className="max-h-40 overflow-y-auto bg-white border border-green-200 rounded p-2">
                            <div className="text-xs font-mono text-gray-700 space-y-0.5 text-left">
                              {normalizeResult.validUrls.slice(0, 100).map((url, i) => (
                                <div key={i} className="hover:bg-gray-50 px-1 break-all">
                                  <span className="text-gray-400 select-none">{i + 1}. </span>
                                  <span className="text-gray-700">{url}</span>
                                </div>
                              ))}
                              {normalizeResult.validUrls.length > 100 && (
                                <div className="text-center text-gray-500 py-1">
                                  ... 还有 {normalizeResult.validUrls.length - 100} 个 URL
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={onReset}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {chrome.i18n.getMessage('import_reselect')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              accept={selectedFormat === 'html' ? '.html,.htm' : '.json'}
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600">{chrome.i18n.getMessage('import_drag_drop')}</p>
            </div>
          </div>
        )}
      </div>

      {/* 导入选项 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">{chrome.i18n.getMessage('import_options')}</label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer">
            <input
              type="checkbox"
              checked={options.skip_duplicates}
              onChange={(e) => setOptions({ ...options, skip_duplicates: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm">{chrome.i18n.getMessage('import_skip_duplicates')}</span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer">
            <input
              type="checkbox"
              checked={options.create_missing_tags}
              onChange={(e) => setOptions({ ...options, create_missing_tags: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm">{chrome.i18n.getMessage('import_create_tags')}</span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer">
            <input
              type="checkbox"
              checked={options.preserve_timestamps}
              onChange={(e) => setOptions({ ...options, preserve_timestamps: e.target.checked })}
              className="h-4 w-4"
            />
            <span className="text-sm">{chrome.i18n.getMessage('import_preserve_time')}</span>
          </label>

          {selectedFormat === 'html' && (
            <label className="flex items-center space-x-2 p-2 rounded-lg border cursor-pointer">
              <input
                type="checkbox"
                checked={options.folder_as_tag}
                onChange={(e) => setOptions({ ...options, folder_as_tag: e.target.checked })}
                className="h-4 w-4"
              />
              <span className="text-sm">{chrome.i18n.getMessage('import_folder_as_tag')}</span>
            </label>
          )}
        </div>
      </div>

      {/* 开始按钮 */}
      <button
        onClick={onStartImport}
        disabled={!selectedFile || isValidating || !normalizeResult || normalizeResult.validUrls.length === 0}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {(isAiRequired || enableAiOrganize) ? (
          <>
            <Sparkles className="h-4 w-4" />
            <span>
              {!normalizeResult 
                ? chrome.i18n.getMessage('import_parsing') 
                : isAiRequired
                  ? `下一步：AI 整理 (${normalizeResult.validUrls.length} 个 URL)`
                  : chrome.i18n.getMessage('import_next_step', [normalizeResult.validUrls.length.toString()])}
            </span>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            <span>{chrome.i18n.getMessage('import_start')}</span>
          </>
        )}
      </button>
    </div>
  )
}
