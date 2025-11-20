import { useState } from 'react'
import { Key, Copy, Trash2, Plus } from 'lucide-react'
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from '@/hooks/useApiKeys'
import { useToastStore } from '@/stores/toastStore'
import type { ApiKey } from '@/services/api-keys'

export function ApiSettingsTab() {
  const { data, isLoading } = useApiKeys()
  const createApiKey = useCreateApiKey()
  const revokeApiKey = useRevokeApiKey()
  const { addToast } = useToastStore()
  const [newKeyName, setNewKeyName] = useState('')

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      addToast('error', '请输入 API Key 名称')
      return
    }

    try {
      await createApiKey.mutateAsync({ name: newKeyName.trim() })
      setNewKeyName('')
      addToast('success', 'API Key 创建成功')
    } catch {
      addToast('error', '创建失败')
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm('确定要撤销这个 API Key 吗？此操作不可恢复。')) return

    try {
      await revokeApiKey.mutateAsync(id)
      addToast('success', 'API Key 已撤销')
    } catch {
      addToast('error', '撤销失败')
    }
  }

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key)
    addToast('success', '已复制到剪贴板')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* API Keys 管理 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">API Keys</h3>
          <p className="text-sm text-muted-foreground mt-1">
            创建和管理 API 密钥，用于第三方应用访问
          </p>
        </div>

        {/* 创建新 Key */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="输入 API Key 名称..."
            className="input flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={createApiKey.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            创建
          </button>
        </div>

        {/* Keys 列表 */}
        <div className="space-y-3">
          {data?.keys?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">暂无 API Key</p>
            </div>
          ) : (
            data?.keys?.map((key: ApiKey) => (
              <div
                key={key.id}
                className="p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-medium">{key.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono flex-1 truncate">
                        {key.key_prefix}••••••••••••••••
                      </code>
                      <button
                        onClick={() => handleCopy(key.key_prefix)}
                        className="p-1 hover:bg-muted rounded"
                        title="复制密钥前缀"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      创建于 {new Date(key.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border"></div>

      {/* 提示信息 */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              安全提示
            </h4>
            <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>• API Key 创建后请立即保存，之后将无法再次查看完整密钥</li>
              <li>• 不要在公开场合分享你的 API Key</li>
              <li>• 如果 API Key 泄露，请立即撤销并创建新的</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
