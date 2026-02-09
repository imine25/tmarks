/**
 * 导入执行步骤组件
 */

import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { ParsedBookmark, ImportResult } from '@/types/import'

interface ImportStepProps {
  bookmarks: ParsedBookmark[]
  isImporting: boolean
  importProgress: { current: number; total: number; status: string } | null
  importResult: ImportResult | null
  onImport: (bookmarks: ParsedBookmark[]) => void
}

export function ImportStep({
  bookmarks,
  isImporting,
  importProgress,
  importResult,
  onImport
}: ImportStepProps) {
  
  if (importResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            importResult.success > 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {importResult.success > 0 ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{chrome.i18n.getMessage('import_result_title')}</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">{importResult.success}</div>
            <div className="text-xs text-gray-600">{chrome.i18n.getMessage('import_result_success')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-red-600">{importResult.failed}</div>
            <div className="text-xs text-gray-600">{chrome.i18n.getMessage('import_result_failed')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-600">{importResult.skipped}</div>
            <div className="text-xs text-gray-600">{chrome.i18n.getMessage('import_result_skipped')}</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">{importResult.total}</div>
            <div className="text-xs text-gray-600">{chrome.i18n.getMessage('import_result_total')}</div>
          </div>
        </div>

        {importResult.total > 0 && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">{chrome.i18n.getMessage('import_result_rate')}</span>
              <span className="font-medium">
                {Math.round((importResult.success / importResult.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(importResult.success / importResult.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {importResult.errors.length > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                {chrome.i18n.getMessage('import_result_errors')} ({importResult.errors.length})
              </span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {importResult.errors.slice(0, 5).map((error, i) => (
                <div key={i} className="text-xs text-red-600">
                  {error.item.title || error.item.url}: {error.error}
                </div>
              ))}
              {importResult.errors.length > 5 && (
                <div className="text-xs text-red-600">
                  ...{chrome.i18n.getMessage('import_preview_more', [(importResult.errors.length - 5).toString()])}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (isImporting && importProgress) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{chrome.i18n.getMessage('import_importing')}</h3>
            <p className="text-sm text-gray-600">{importProgress.status}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{importProgress.status}</span>
            <span className="font-medium">{importProgress.current} / {importProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <p className="text-gray-600">{chrome.i18n.getMessage('import_start')}</p>
        <button
          onClick={() => onImport(bookmarks)}
          className="mt-4 px-6 py-3 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
        >
          {chrome.i18n.getMessage('import_start')}
        </button>
      </div>
    </div>
  )
}
