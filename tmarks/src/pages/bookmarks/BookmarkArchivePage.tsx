import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Archive, RotateCcw, Trash2, Calendar, Link2, ArrowLeft, Info, Search, Tag as TagIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { bookmarksService } from '@/services/bookmarks'
import type { Bookmark } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { zhCN, enUS } from 'date-fns/locale'
import { useToastStore } from '@/stores/toastStore'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { logger } from '@/lib/logger'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { MobileHeader } from '@/components/common/MobileHeader'

export function BookmarkArchivePage() {
  const { t, i18n } = useTranslation('bookmarks')
  const dateLocale = i18n.language === 'zh-CN' ? zhCN : enUS
  const isMobile = useIsMobile()
  const { success, error: showError } = useToastStore()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
    isDanger?: boolean
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false,
  })

  const loadArchive = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      // 查询归档书签
      const response = await bookmarksService.getBookmarks({ 
        page_size: 100,
        archived: true 
      })
      setBookmarks(response.bookmarks)
      setFilteredBookmarks(response.bookmarks)
    } catch (err) {
      logger.error('Failed to load archived bookmarks:', err)
      setError(t('archive.loadFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadArchive()
  }, [loadArchive])

  // 搜索过滤
  useEffect(() => {
    if (!searchKeyword.trim()) {
      setFilteredBookmarks(bookmarks)
      return
    }

    const keyword = searchKeyword.toLowerCase()
    const filtered = bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(keyword) ||
      bookmark.url.toLowerCase().includes(keyword) ||
      bookmark.description?.toLowerCase().includes(keyword) ||
      bookmark.tags?.some(tag => tag.name.toLowerCase().includes(keyword))
    )
    setFilteredBookmarks(filtered)
  }, [searchKeyword, bookmarks])

  const handleUnarchive = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('archive.unarchiveTitle'),
      message: t('archive.unarchiveMessage', { title }),
      isDanger: false,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        try {
          await bookmarksService.updateBookmark(id, { is_archived: false })
          setBookmarks(prev => prev.filter(b => b.id !== id))
          setFilteredBookmarks(prev => prev.filter(b => b.id !== id))
          success(t('archive.unarchiveSuccess'))
        } catch (err) {
          logger.error('Failed to unarchive bookmark:', err)
          showError(t('archive.unarchiveFailed'))
        }
      },
    })
  }

  const handleDelete = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: t('archive.deleteTitle'),
      message: t('archive.deleteMessage', { title }),
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        try {
          await bookmarksService.deleteBookmark(id)
          setBookmarks(prev => prev.filter(b => b.id !== id))
          setFilteredBookmarks(prev => prev.filter(b => b.id !== id))
          success(t('archive.deleteSuccess'))
        } catch (err) {
          logger.error('Failed to delete bookmark:', err)
          showError(t('archive.deleteFailed'))
        }
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={loadArchive}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            {t('trash.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-screen flex flex-col bg-background ${isMobile ? 'overflow-hidden' : ''}`}>
      {/* 移动端顶部工具栏 */}
      {isMobile && (
        <MobileHeader
          title={t('archive.title')}
          showMenu={false}
          showSearch={false}
          showMore={false}
        />
      )}

      <div className={`flex-1 overflow-y-auto ${isMobile ? 'pb-20 min-h-0' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header - 桌面端显示 */}
          {!isMobile && (
            <div className="mb-8">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{t('archive.backToBookmarks')}</span>
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Archive className="w-8 h-8 text-muted-foreground" />
                    <h1 className="text-3xl font-bold text-foreground">{t('archive.title')}</h1>
                    <span className="text-2xl text-muted-foreground">({bookmarks.length})</span>
                  </div>
                  <p className="text-muted-foreground">{t('archive.description')}</p>
                </div>
              </div>
            </div>
          )}

          {/* 搜索框 */}
          {bookmarks.length > 0 && (
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder={t('archive.searchPlaceholder')}
                  className="input w-full pl-10"
                />
              </div>
            </div>
          )}

          {/* Empty State */}
          {bookmarks.length === 0 ? (
            <div className="text-center py-16">
              <Archive className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">{t('archive.emptyState.title')}</h3>
              <p className="text-muted-foreground mb-4">{t('archive.emptyState.description')}</p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('archive.backToBookmarks')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 提示信息 */}
              <div className="flex items-start gap-3 p-4 bg-info/10 border border-info/20 rounded-lg">
                <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>{t('archive.infoBox.tip1')}</p>
                  <p className="mt-1">{t('archive.infoBox.tip2')}</p>
                </div>
              </div>

              {/* 搜索结果提示 */}
              {searchKeyword && (
                <div className="text-sm text-muted-foreground">
                  {t('archive.searchResults', { count: filteredBookmarks.length, total: bookmarks.length })}
                </div>
              )}

              {/* 书签列表 */}
              {filteredBookmarks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('archive.noResults')}</p>
                </div>
              ) : (
                filteredBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="card p-4 sm:p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          {bookmark.favicon ? (
                            <img
                              src={bookmark.favicon}
                              alt=""
                              className="w-6 h-6 rounded flex-shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <Link2 className="w-6 h-6 text-muted-foreground flex-shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                              {bookmark.title}
                            </h3>
                            <a
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline truncate block mb-2"
                            >
                              {bookmark.url}
                            </a>
                            {bookmark.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {bookmark.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {t('archive.archivedAt', {
                                    time: bookmark.updated_at
                                      ? formatDistanceToNow(new Date(bookmark.updated_at), {
                                          addSuffix: true,
                                          locale: dateLocale,
                                        })
                                      : ''
                                  })}
                                </span>
                              </div>
                              {bookmark.tags && bookmark.tags.length > 0 && (
                                <div className="flex items-center gap-1 flex-wrap">
                                  <TagIcon className="w-4 h-4" />
                                  {bookmark.tags.map(tag => (
                                    <span
                                      key={tag.id}
                                      className="px-2 py-0.5 rounded-full text-xs"
                                      style={{
                                        backgroundColor: tag.color ? `${tag.color}20` : 'var(--muted)',
                                        color: tag.color || 'var(--muted-foreground)'
                                      }}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleUnarchive(bookmark.id, bookmark.title)}
                          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors text-sm"
                          title={t('archive.unarchiveTooltip')}
                        >
                          <RotateCcw className="w-4 h-4" />
                          {t('archive.unarchive')}
                        </button>
                        <button
                          onClick={() => handleDelete(bookmark.id, bookmark.title)}
                          className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm"
                          title={t('archive.deleteTooltip')}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('archive.delete')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Confirm Dialog */}
          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            confirmText={confirmDialog.isDanger ? t('trash.confirmDelete') : t('trash.confirm')}
            cancelText={t('batch.cancel')}
          />
        </div>
      </div>
    </div>
  )
}
