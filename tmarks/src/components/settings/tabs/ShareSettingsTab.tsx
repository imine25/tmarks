import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Copy, RefreshCw } from 'lucide-react'
import { useShareSettings, useUpdateShareSettings } from '@/hooks/useShare'
import { useToastStore } from '@/stores/toastStore'
import { InfoBox } from '../InfoBox'
import { Toggle } from '@/components/common/Toggle'

export function ShareSettingsTab() {
  const { t } = useTranslation('settings')
  const { data, isLoading } = useShareSettings()
  const updateShare = useUpdateShareSettings()
  const { addToast } = useToastStore()

  const [enabled, setEnabled] = useState(false)
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (data) {
      setEnabled(data.enabled || false)
      setSlug(data.slug || '')
      setTitle(data.title || '')
      setDescription(data.description || '')
    }
  }, [data])

  const shareUrl = useMemo(() => {
    if (!slug) return ''
    return `${window.location.origin}/share/${slug}`
  }, [slug])

  const handleSave = async () => {
    try {
      await updateShare.mutateAsync({
        enabled: enabled,
        slug: slug.trim() || null,
        title: title.trim() || null,
        description: description.trim() || null,
      })
      addToast('success', t('share.saveSuccess'))
    } catch {
      addToast('error', t('share.saveFailed'))
    }
  }

  const handleRegenerate = async () => {
    try {
      await updateShare.mutateAsync({
        regenerate_slug: true,
        enabled: true,
        title: title.trim() || null,
        description: description.trim() || null,
      })
      addToast('success', t('share.regenerateSuccess'))
    } catch {
      addToast('error', t('share.regenerateFailed'))
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      addToast('success', t('share.copySuccess'))
    } catch {
      addToast('error', t('share.copyFailed'))
    }
  }

  const handleReset = () => {
    if (data) {
      setEnabled(data.enabled || false)
      setSlug(data.slug || '')
      setTitle(data.title || '')
      setDescription(data.description || '')
      addToast('info', t('share.resetSuccess'))
    }
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
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{t('share.publicShare.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('share.publicShare.description')}
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
          <div>
            <div className="text-sm font-medium mb-1">{t('share.publicShare.enable')}</div>
            <div className="text-xs text-muted-foreground">
              {t('share.publicShare.enableHint')}
            </div>
          </div>
          <Toggle
            checked={enabled}
            onChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">{t('share.slug.label')}</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder={t('share.slug.placeholder')}
                    className="input flex-1"
                    disabled={updateShare.isPending}
                  />
                  <button
                    onClick={handleRegenerate}
                    disabled={updateShare.isPending}
                    className="btn btn-ghost btn-sm sm:btn flex items-center gap-2 justify-center hover:bg-muted/30"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>{t('share.slug.regenerate')}</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('share.slug.hint')}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium">{t('share.pageTitle.label')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('share.pageTitle.placeholder')}
                  className="input"
                  disabled={updateShare.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('share.pageDescription.label')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('share.pageDescription.placeholder')}
                className="input min-h-[80px]"
                disabled={updateShare.isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('share.shareLink.label')}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl || t('share.shareLink.placeholder')}
                  className="input flex-1"
                />
                <button
                  onClick={handleCopyLink}
                  disabled={!shareUrl}
                  className="btn btn-ghost flex items-center gap-2 hover:bg-muted/30"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? t('share.shareLink.copied') : t('share.shareLink.copy')}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                onClick={handleReset}
                disabled={updateShare.isPending}
                className="btn btn-ghost btn-sm sm:btn hover:bg-muted/30"
              >
                {t('share.reset')}
              </button>
              <button
                onClick={handleSave}
                disabled={updateShare.isPending}
                className="btn btn-primary btn-sm sm:btn"
              >
                {updateShare.isPending ? t('action.saving') : t('action.save')}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-border"></div>

      <InfoBox icon={Share2} title={t('share.infoBox.title')} variant="success">
        <ul className="space-y-1">
          <li>• {t('share.infoBox.tip1')}</li>
          <li>• {t('share.infoBox.tip2')}</li>
          <li>• {t('share.infoBox.tip3')}</li>
        </ul>
      </InfoBox>
    </div>
  )
}
