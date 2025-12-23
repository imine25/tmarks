/**
 * AI 整理预览对比组件
 * 显示原始数据 vs AI 整理后数据的对比
 */

import { useState } from 'react'
import { Check, X, Edit2, Tag, FileText, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import type { OrganizedBookmark, OrganizeResult } from '@/lib/ai/organize'

interface AiPreviewStepProps {
  result: OrganizeResult
  onConfirm: (bookmarks: OrganizedBookmark[]) => void
  onBack: () => void
  onSkip: () => void
}

export function AiPreviewStep({
  result,
  onConfirm,
  onBack,
  onSkip
}: AiPreviewStepProps) {
  // 可编辑的书签列表
  const [editedBookmarks, setEditedBookmarks] = useState<OrganizedBookmark[]>(result.bookmarks)
  
  // 展开/收起状态
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  
  // 编辑中的项目
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingTags, setEditingTags] = useState<string>('')

  // 统计
  const totalBookmarks = editedBookmarks.length
  const bookmarksWithAiTags = editedBookmarks.filter(b => b.ai_tags && b.ai_tags.length > 0).length
  const totalNewTags = result.newTags.length

  // 切换展开
  const toggleExpand = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  // 开始编辑标签
  const startEditTags = (index: number) => {
    const bookmark = editedBookmarks[index]
    if (!bookmark) return
    const tags = bookmark.ai_tags?.length ? bookmark.ai_tags : bookmark.tags
    setEditingIndex(index)
    setEditingTags(tags.join(', '))
  }

  // 保存编辑的标签
  const saveEditTags = () => {
    if (editingIndex === null) return
    
    const newTags = editingTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    
    setEditedBookmarks(prev => prev.map((b, i) => 
      i === editingIndex ? { ...b, ai_tags: newTags } : b
    ))
    
    setEditingIndex(null)
    setEditingTags('')
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingIndex(null)
    setEditingTags('')
  }

  // 使用原始标签
  const useOriginalTags = (index: number) => {
    setEditedBookmarks(prev => prev.map((b, i) => 
      i === index ? { ...b, ai_tags: b.original_tags || b.tags } : b
    ))
  }

  // 确认导入
  const handleConfirm = () => {
    // 将 ai_tags 合并到 tags
    const finalBookmarks = editedBookmarks.map(b => ({
      ...b,
      tags: b.ai_tags?.length ? b.ai_tags : b.tags
    }))
    onConfirm(finalBookmarks)
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
          <Check className="w-5 h-5 text-success" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI 整理完成</h3>
          <p className="text-sm text-muted-foreground">
            预览整理结果，可手动调整后导入
          </p>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-lg bg-card border border-border text-center">
          <div className="text-xl font-bold text-foreground">{totalBookmarks}</div>
          <div className="text-xs text-muted-foreground">总书签数</div>
        </div>
        <div className="p-3 rounded-lg bg-card border border-border text-center">
          <div className="text-xl font-bold text-success">{bookmarksWithAiTags}</div>
          <div className="text-xs text-muted-foreground">已生成标签</div>
        </div>
        <div className="p-3 rounded-lg bg-card border border-border text-center">
          <div className="text-xl font-bold text-primary">{totalNewTags}</div>
          <div className="text-xs text-muted-foreground">新增标签</div>
        </div>
      </div>

      {/* Token 消耗 */}
      <div className="p-3 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Token 消耗</span>
          <span className="font-medium text-foreground">
            约 {result.tokensUsed.toLocaleString()} tokens
          </span>
        </div>
      </div>

      {/* 书签列表 */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {editedBookmarks.slice(0, 50).map((bookmark, index) => {
          const isExpanded = expandedItems.has(index)
          const isEditing = editingIndex === index
          const hasAiTags = bookmark.ai_tags && bookmark.ai_tags.length > 0
          const originalTags = bookmark.original_tags || bookmark.tags || []
          const currentTags = bookmark.ai_tags?.length ? bookmark.ai_tags : bookmark.tags

          return (
            <div
              key={index}
              className="rounded-lg border border-border bg-card overflow-hidden"
            >
              {/* 标题行 */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/30"
                onClick={() => toggleExpand(index)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {bookmark.title}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {bookmark.url}
                  </div>
                </div>
                
                {hasAiTags && (
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                )}
                
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {/* 展开内容 */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                  {/* 原始标签 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Tag className="w-3 h-3" />
                      原始标签
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {originalTags.length > 0 ? (
                        originalTags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">无</span>
                      )}
                    </div>
                  </div>

                  {/* AI 生成的标签 */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Sparkles className="w-3 h-3" />
                      AI 生成标签
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingTags}
                          onChange={(e) => setEditingTags(e.target.value)}
                          className="input w-full text-sm"
                          placeholder="输入标签，用逗号分隔"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditTags}
                            className="btn btn-primary btn-sm flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            保存
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="btn btn-ghost btn-sm flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1 flex-1">
                          {currentTags.length > 0 ? (
                            currentTags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">无</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditTags(index)
                          }}
                          className="p-1 hover:bg-muted rounded"
                          title="编辑标签"
                        >
                          <Edit2 className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* AI 生成的描述 */}
                  {bookmark.ai_description && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3" />
                        AI 生成描述
                      </div>
                      <p className="text-xs text-foreground bg-muted/30 p-2 rounded">
                        {bookmark.ai_description}
                      </p>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  {hasAiTags && originalTags.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        useOriginalTags(index)
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      使用原始标签
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {editedBookmarks.length > 50 && (
          <div className="text-center text-sm text-muted-foreground py-2">
            还有 {editedBookmarks.length - 50} 个书签未显示
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <button
          onClick={onBack}
          className="btn btn-ghost"
        >
          返回修改
        </button>
        <button
          onClick={onSkip}
          className="btn btn-ghost"
        >
          放弃整理结果
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 btn btn-primary flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          确认导入 ({totalBookmarks} 个书签)
        </button>
      </div>
    </div>
  )
}
