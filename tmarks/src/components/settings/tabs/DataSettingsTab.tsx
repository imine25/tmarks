import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Download, Upload, FileJson, FileCode, Camera, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { ExportSection } from '@/components/import-export/ExportSection'
import { ImportSection } from '@/components/import-export/ImportSection'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { BOOKMARKS_QUERY_KEY } from '@/hooks/useBookmarks'
import { TAGS_QUERY_KEY } from '@/hooks/useTags'
import { useToastStore } from '@/stores/toastStore'
import { useAuthStore } from '@/stores/authStore'
import { useR2StorageQuota } from '@/hooks/useStorage'
import type { ExportFormat, ExportOptions, ImportResult } from '@shared/import-export-types'

export function DataSettingsTab() {
  const { t } = useTranslation('settings')
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const { accessToken } = useAuthStore()
  const { data: r2Quota, isLoading: isLoadingR2Quota } = useR2StorageQuota()
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [lastOperation, setLastOperation] = useState<{
    type: 'export' | 'import' | 'cleanup'
    timestamp: string
    details: string
  } | null>(null)
  const [isCleaningSnapshots, setIsCleaningSnapshots] = useState(false)
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false)

  const handleExportComplete = (format: ExportFormat, options: ExportOptions) => {
    setLastOperation({
      type: 'export',
      timestamp: new Date().toLocaleString(),
      details: `${format.toUpperCase()}${options.include_tags ? ' + tags' : ''}${options.include_metadata ? ' + metadata' : ''}`
    })
  }

  const handleImportComplete = (result: ImportResult) => {
    const failedText = result.failed > 0 ? t('data.importFailed', { count: result.failed }) : ''
    setLastOperation({
      type: 'import',
      timestamp: new Date().toLocaleString(),
      details: t('data.importSuccess', { success: result.success, tags: result.created_tags.length, failed: failedText })
    })

    queryClient.invalidateQueries({ queryKey: [BOOKMARKS_QUERY_KEY] })
    queryClient.invalidateQueries({ queryKey: [TAGS_QUERY_KEY] })
  }

  const handleCleanupAllSnapshots = async () => {
    setShowCleanupConfirm(true)
  }

  const confirmCleanupAllSnapshots = async () => {
    setShowCleanupConfirm(false)
    setIsCleaningSnapshots(true)
    try {
      const response = await fetch('/api/v1/bookmarks?page=1&page_size=1000', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(t('data.fetchBookmarksFailed'))
      }

      const data = await response.json()
      const bookmarks = data.data?.bookmarks || []
      
      let totalCleaned = 0
      let processedCount = 0

      for (const bookmark of bookmarks) {
        if (bookmark.snapshot_count > 0) {
          try {
            const cleanupResponse = await fetch(`/api/v1/bookmarks/${bookmark.id}/snapshots/cleanup`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ verify_and_fix: true }),
            })

            if (cleanupResponse.ok) {
              const result = await cleanupResponse.json()
              totalCleaned += result.data?.deleted_count || 0
            }
          } catch (error) {
            console.error(`Clean snapshot failed for bookmark ${bookmark.id}:`, error)
          }
        }
        processedCount++
      }

      setLastOperation({
        type: 'cleanup',
        timestamp: new Date().toLocaleString(),
        details: t('data.cleanSnapshotsSuccess', { count: totalCleaned })
      })

      if (totalCleaned > 0) {
        addToast('success', t('data.cleanSnapshotsSuccess', { count: totalCleaned }))
        queryClient.invalidateQueries({ queryKey: [BOOKMARKS_QUERY_KEY] })
      } else {
        addToast('info', t('data.cleanSnapshotsNone'))
      }
    } catch (error) {
      console.error('Clean snapshots failed:', error)
      addToast('error', t('data.cleanSnapshotsFailed'))
    } finally {
      setIsCleaningSnapshots(false)
    }
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        isOpen={showCleanupConfirm}
        title={t('data.cleanSnapshotsConfirmTitle')}
        message={t('data.cleanSnapshotsConfirmMessage')}
        type="warning"
        onConfirm={confirmCleanupAllSnapshots}
        onCancel={() => setShowCleanupConfirm(false)}
      />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('data.r2Storage.title')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('data.r2Storage.description')}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {isLoadingR2Quota || !r2Quota ? (
            t('data.loading')
          ) : (
            <>
              {t('data.r2Storage.currentUsage')}{' '}
              <strong>
                {(r2Quota.used_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
              </strong>
              {' / '}
              {r2Quota.unlimited || r2Quota.limit_bytes === null ? (
                t('data.r2Storage.unlimited')
              ) : (
                <>
                  {(r2Quota.limit_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                </>
              )}
            </>
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('data.importExport.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('data.importExport.description')}
          </p>
        </div>

        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Download className="w-4 h-4" />
            {t('data.importExport.export')}
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="w-4 h-4" />
            {t('data.importExport.import')}
          </button>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          {activeTab === 'export' && (
            <ExportSection onExport={handleExportComplete} />
          )}

          {activeTab === 'import' && (
            <ImportSection onImport={handleImportComplete} />
          )}
        </div>

        {lastOperation && (
          <div className="p-4 rounded-lg border border-border bg-card">
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                lastOperation.type === 'export'
                  ? 'bg-primary/10 text-primary'
                  : lastOperation.type === 'import'
                  ? 'bg-success/10 text-success'
                  : 'bg-warning/10 text-warning'
              }`}>
                {lastOperation.type === 'export' ? (
                  <Download className="w-4 h-4" />
                ) : lastOperation.type === 'import' ? (
                  <Upload className="w-4 h-4" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground text-sm">
                    {t(`data.lastOperation.${lastOperation.type}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {lastOperation.timestamp}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {lastOperation.details}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('data.snapshotManagement.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('data.snapshotManagement.description')}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('data.snapshotManagement.cleanOrphan')}</div>
              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                <div>• {t('data.cleanSnapshots.tip1')}</div>
                <div>• {t('data.cleanSnapshots.tip2')}</div>
                <div>• {t('data.cleanSnapshots.tip3')}</div>
                <div>• {t('data.cleanSnapshots.tip4')}</div>
              </div>
              <button
                onClick={handleCleanupAllSnapshots}
                disabled={isCleaningSnapshots}
                className="btn btn-warning btn-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isCleaningSnapshots ? t('data.snapshotManagement.cleaning') : t('data.snapshotManagement.cleanButton')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('data.exportFeature.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('data.exportFeature.description')}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <FileJson className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('data.exportFeature.jsonTitle')}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• {t('data.export.tip1')}</div>
                <div>• {t('data.export.tip2')}</div>
                <div>• {t('data.export.tip3')}</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <FileCode className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('data.exportFeature.htmlTitle')}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• {t('data.export.htmlTip1')}</div>
                <div>• {t('data.export.htmlTip2')}</div>
                <div>• {t('data.export.htmlTip3')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('data.importFeature.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('data.importFeature.description')}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Upload className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('data.importFeature.supportedFormats')}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• {t('data.importFeature.formatTip1')}</div>
                <div>• {t('data.importFeature.formatTip2')}</div>
                <div>• {t('data.importFeature.formatTip3')}</div>
                <div>• {t('data.importFeature.formatTip4')}</div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
            <Database className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">{t('data.importFeature.smartProcessing')}</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>• {t('data.importFeature.processTip1')}</div>
                <div>• {t('data.importFeature.processTip2')}</div>
                <div>• {t('data.importFeature.processTip3')}</div>
                <div>• {t('data.importFeature.processTip4')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
