/**
 * 导入功能组件
 */

import { useTranslation } from 'react-i18next'
import {
  Upload,
  FileText,
  Code,
  CheckCircle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DragDropUpload } from '../common/DragDropUpload'
import { ProgressIndicator } from '../common/ProgressIndicator'
import { ErrorDisplay } from '../common/ErrorDisplay'
import { useImportState } from './hooks/useImportState'
import { useImportActions, formatFileSize } from './hooks/useImportActions'
import type { ImportFormat, ImportResult } from '@shared/import-export-types'

interface ImportSectionProps {
  onImport?: (result: ImportResult) => void
}

export function ImportSection({ onImport }: ImportSectionProps) {
  const { t } = useTranslation('import')
  const navigate = useNavigate()

  const state = useImportState()
  const {
    selectedFormat,
    selectedFile,
    isImporting,
    isValidating,
    importProgress,
    importResult,
    validationResult,
    options,
    setOptions,
    fileInputRef
  } = state

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

  const formatOptions = [
    {
      value: 'json' as ImportFormat,
      label: t('format.json'),
      description: t('format.tmarksFormat'),
      icon: Code,
      extensions: ['.json']
    }
  ]

  const renderUploadStep = () => (
    <div className="space-y-6">
      {/* 格式说明 */}
      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">{t('import.formatNotice.title', '仅支持 TMarks 格式')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('import.formatNotice.description', '本系统仅支持导入和导出 TMarks JSON 格式的书签数据。如需从浏览器导入书签，请先使用浏览器的导出功能，然后使用第三方工具转换为 TMarks 格式。')}
            </p>
          </div>
        </div>
      </div>

      {/* 格式选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">{t('import.selectFormat')}</label>
        <div className="grid grid-cols-1 gap-3">
          {formatOptions.map((format) => {
            const Icon = format.icon
            return (
              <div
                key={format.value}
                className="relative rounded-lg border border-primary bg-primary/5 p-4"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{format.label}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {format.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('import.supportedExtensions', '支持的文件扩展名')}: {format.extensions.join(', ')}
                    </p>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 文件选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">{t('import.selectFile')}</label>

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
                      <p className="text-lg font-medium text-foreground">{t('import.validating')}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-8 w-8 text-success" />
                    <div>
                      <p className="text-lg font-medium text-foreground">{t('import.fileSelected')}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted"
                    >
                      {t('import.reselect')}
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
          title={validationResult.valid ? t('import.validationPassed') : t('import.validationFailed')}
          dismissible={false}
          collapsible={true}
          showDetails={true}
        />
      )}

      {/* 导入选项 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-foreground">{t('import.options')}</label>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.skip_duplicates}
              onChange={(e) => setOptions((prev) => ({ ...prev, skip_duplicates: e.target.checked }))}
              className="h-4 w-4 text-primary border-border rounded focus:ring-primary flex-shrink-0"
            />
            <span className="text-sm text-foreground">{t('import.skipDuplicates')}</span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.create_missing_tags}
              onChange={(e) => setOptions((prev) => ({ ...prev, create_missing_tags: e.target.checked }))}
              className="h-4 w-4 text-primary border-border rounded focus:ring-primary flex-shrink-0"
            />
            <span className="text-sm text-foreground">{t('import.createTags')}</span>
          </label>

          <label className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:border-muted-foreground/30 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={options.preserve_timestamps}
              onChange={(e) => setOptions((prev) => ({ ...prev, preserve_timestamps: e.target.checked }))}
              className="h-4 w-4 text-primary border-border rounded focus:ring-primary flex-shrink-0"
            />
            <span className="text-sm text-foreground">{t('import.preserveTime')}</span>
          </label>
        </div>
      </div>

      {/* 操作按钮 */}
      {!importResult && (
        <div className="flex space-x-3">
          <button
            onClick={() => selectedFile && handleImport(selectedFile)}
            disabled={!selectedFile || !validationResult?.valid || isImporting || isValidating}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 sm:py-2 text-sm font-medium text-primary-foreground bg-primary border border-transparent rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            <span>{isImporting ? t('import.importing') : t('import.startImport')}</span>
          </button>
        </div>
      )}
    </div>
  )

  const renderImportProgress = () => (
    <div className="space-y-6">
      {importProgress && (
        <ProgressIndicator
          progress={{
            current: importProgress.current,
            total: importProgress.total,
            percentage: (importProgress.current / importProgress.total) * 100,
            status: importProgress.status,
            message: `${importProgress.current} / ${importProgress.total}`
          }}
          variant="detailed"
          showSpeed={true}
          showETA={true}
        />
      )}

      {importResult && (
        <div className="bg-muted rounded-lg p-3 sm:p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">{t('result.title')}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-success">{importResult.success}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('result.success')}</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-destructive">{importResult.failed}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('result.failed')}</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-warning">{importResult.skipped}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('result.skipped')}</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-lg sm:text-xl font-bold text-primary">{importResult.total}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{t('result.total')}</div>
            </div>
          </div>

          {importResult.total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                <span className="text-muted-foreground">{t('result.successRate')}</span>
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
                  details: `${error.item.title || error.item.url}`
                }))}
                variant="error"
                title={`${t('result.errors')} (${importResult.errors.length})`}
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
                <span>{t('result.viewBookmarks')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-3 sm:py-2 text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary touch-manipulation"
              >
                {t('result.continueImport')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  if (importResult || importProgress) {
    return renderImportProgress()
  }

  return renderUploadStep()
}
