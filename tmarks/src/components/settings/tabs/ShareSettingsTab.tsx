import { useState, useEffect } from 'react'
import { Share2, Copy, RefreshCw } from 'lucide-react'
import { useShareSettings, useUpdateShareSettings } from '@/hooks/useShare'
import { useToastStore } from '@/stores/toastStore'

export function ShareSettingsTab() {
  const { data, isLoading } = useShareSettings()
  const updateShare = useUpdateShareSettings()
  const { addToast } = useToastStore()

  const [enabled, setEnabled] = useState(false)
  const [slug, setSlug] = useState('')

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled || false)
      setSlug(data.slug || '')
    }
  }, [data])

  const handleSave = async () => {
    try {
      await updateShare.mutateAsync({
        enabled: enabled,
        slug: slug.trim(),
      })
      addToast('success', '分享设置已保存')
    } catch {
      addToast('error', '保存失败')
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/share/${slug}`
    navigator.clipboard.writeText(link)
    addToast('success', '链接已复制')
  }

  const generateSlug = () => {
    const random = Math.random().toString(36).substring(2, 10)
    setSlug(random)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const shareLink = `${window.location.origin}/share/${slug}`

  return (
    <div className="space-y-6">
      {/* 公开分享设置 */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">公开分享</h3>
          <p className="text-sm text-muted-foreground mt-1">
            创建公开链接，让其他人查看你的书签
          </p>
        </div>

        {/* 启用开关 */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
          <div>
            <div className="text-sm font-medium mb-1">启用公开分享</div>
            <div className="text-xs text-muted-foreground">
              开启后，其他人可以通过链接访问你的公开书签
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* 分享链接设置 */}
        {enabled && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">分享链接后缀</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="自定义链接后缀"
                  className="input flex-1"
                />
                <button
                  onClick={generateSlug}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  随机
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                只能包含小写字母、数字和连字符
              </p>
            </div>

            {/* 分享链接预览 */}
            {slug && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="text-xs text-muted-foreground mb-2">你的分享链接：</div>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-background px-3 py-2 rounded flex-1 truncate">
                    {shareLink}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="btn btn-sm btn-secondary flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    复制
                  </button>
                </div>
              </div>
            )}

            {/* 保存按钮 */}
            <button
              onClick={handleSave}
              disabled={updateShare.isPending || !slug}
              className="btn btn-primary w-full"
            >
              {updateShare.isPending ? '保存中...' : '保存设置'}
            </button>
          </>
        )}
      </div>

      <div className="border-t border-border"></div>

      {/* 提示信息 */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Share2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
              分享功能说明
            </h4>
            <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
              <li>• 只有标记为"公开"的书签才会在分享页面显示</li>
              <li>• 你可以随时修改分享链接或关闭分享功能</li>
              <li>• 分享页面不需要登录即可访问</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
