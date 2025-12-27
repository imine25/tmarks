import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Key, Copy, Trash2, Plus, Eye, Ban, Info, AlertTriangle } from 'lucide-react'
import { useApiKeys, useRevokeApiKey, useDeleteApiKey } from '@/hooks/useApiKeys'
import { useToastStore } from '@/stores/toastStore'
import { CreateApiKeyModal } from '@/components/api-keys/CreateApiKeyModal'
import { ApiKeyDetailModal } from '@/components/api-keys/ApiKeyDetailModal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { ApiKey } from '@/services/api-keys'
import { InfoBox } from '../InfoBox'

export function ApiSettingsTab() {
  const { t } = useTranslation('settings')
  const { data, isLoading } = useApiKeys()
  const revokeApiKey = useRevokeApiKey()
  const deleteApiKey = useDeleteApiKey()
  const { addToast } = useToastStore()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null)
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const handleRevoke = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: t('apiKey.page.revokeTitle'),
      message: t('apiKey.page.revokeMessage'),
      onConfirm: async () => {
        setConfirmState(null)
        try {
          await revokeApiKey.mutateAsync(id)
          addToast('success', t('apiKey.page.revokeSuccess'))
        } catch {
          addToast('error', t('apiKey.page.revokeFailed'))
        }
      },
    })
  }

  const handleDelete = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: t('apiKey.page.deleteTitle'),
      message: t('apiKey.page.deleteMessage'),
      onConfirm: async () => {
        setConfirmState(null)
        try {
          await deleteApiKey.mutateAsync(id)
          addToast('success', t('apiKey.page.deleteSuccess'))
        } catch {
          addToast('error', t('apiKey.page.deleteFailed'))
        }
      },
    })
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    addToast('success', t('share.copySuccess'))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const keys = data?.keys || []
  const quota = data?.quota || { used: 0, limit: 3 }

  return (
    <div className="space-y-6">
      {confirmState && (
        <ConfirmDialog
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          type="warning"
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">{t('apiKey.page.title')}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t('apiKey.page.description')}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={quota.used >= quota.limit}
            className="btn btn-primary btn-sm sm:btn flex items-center gap-2 justify-center"
          >
            <Plus className="w-4 h-4" />
            {t('apiKey.page.createNew')}
          </button>
        </div>

        <div className="p-3 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('apiKey.page.currentUsage')}</span>
            <span className="font-medium">
              {quota.used} / {quota.limit >= 999 ? t('apiKey.page.unlimited') : quota.limit}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {keys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-4">{t('apiKey.page.empty')}</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
              >
                {t('apiKey.page.createFirst')}
              </button>
            </div>
          ) : (
            keys.map((key: ApiKey) => (
              <div
                key={key.id}
                className={`p-4 rounded-lg border ${
                  key.status === 'revoked'
                    ? 'border-error/30 bg-error/5'
                    : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className={`w-4 h-4 flex-shrink-0 ${
                        key.status === 'revoked' ? 'text-error' : 'text-primary'
                      }`} />
                      <span className="font-medium">{key.name}</span>
                      {key.status === 'revoked' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-error/20 text-error">
                          {t('apiKey.status.revoked')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                        {key.key_prefix}••••••••••••••••
                      </code>
                      <button
                        onClick={() => handleCopy(key.key_prefix)}
                        className="p-1 hover:bg-muted rounded"
                        title={t('apiKey.copyPrefix')}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{t('apiKey.createdAt')} {new Date(key.created_at).toLocaleString()}</span>
                      {key.last_used_at && (
                        <span>{t('apiKey.lastUsed')} {new Date(key.last_used_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedKey(key)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title={t('apiKey.viewDetails')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {key.status === 'active' && (
                      <button
                        onClick={() => handleRevoke(key.id)}
                        className="p-2 text-warning hover:bg-warning/10 rounded-lg transition-colors"
                        title={t('apiKey.revoke')}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(key.id)}
                      className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                      title={t('apiKey.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border"></div>

      <div className="space-y-3">
        <InfoBox icon={Info} title={t('apiKey.infoBox.usageTitle')} variant="info">
          <ul className="space-y-1">
            <li>• {t('apiKey.infoBox.usageTip1')}</li>
            <li>• {t('apiKey.page.tip1', { limit: quota.limit >= 999 ? t('apiKey.page.unlimited') : quota.limit })}</li>
            <li>• {t('apiKey.page.tip2')}</li>
          </ul>
        </InfoBox>

        <InfoBox icon={AlertTriangle} title={t('apiKey.infoBox.securityTitle')} variant="warning">
          <ul className="space-y-1">
            <li>• {t('apiKey.infoBox.securityTip1')}</li>
            <li>• {t('apiKey.infoBox.securityTip2')}</li>
            <li>• {t('apiKey.infoBox.securityTip3')}</li>
          </ul>
        </InfoBox>
      </div>

      {showCreateModal && (
        <CreateApiKeyModal onClose={() => setShowCreateModal(false)} />
      )}

      {selectedKey && (
        <ApiKeyDetailModal
          apiKey={selectedKey}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  )
}
