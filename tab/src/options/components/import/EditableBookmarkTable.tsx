/**
 * 可编辑的书签表格组件
 * 支持：添加/删除标签、编辑标题、分页、搜索、批量操作
 */

import { useState, useMemo } from 'react'
import { X, Plus, Edit2, Check, Search, ChevronLeft, ChevronRight } from 'lucide-react'

export interface EditableBookmark {
  url: string
  title: string
  description?: string
  tags: Array<{
    name: string
    isNew: boolean
    confidence: number
  }>
  isSelected?: boolean
  isSkipped?: boolean
}

interface EditableBookmarkTableProps {
  bookmarks: EditableBookmark[]
  existingTags?: string[]
  onBookmarksChange: (bookmarks: EditableBookmark[]) => void
}

export function EditableBookmarkTable({
  bookmarks,
  existingTags = [],
  onBookmarksChange
}: EditableBookmarkTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const pageSize = 50

  // 搜索过滤
  const filteredBookmarks = useMemo(() => {
    if (!searchQuery) return bookmarks
    const query = searchQuery.toLowerCase()
    return bookmarks.filter(b => 
      b.url.toLowerCase().includes(query) ||
      b.title.toLowerCase().includes(query) ||
      b.tags.some(t => t.name.toLowerCase().includes(query))
    )
  }, [bookmarks, searchQuery])

  // 分页
  const totalPages = Math.ceil(filteredBookmarks.length / pageSize)
  const paginatedBookmarks = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredBookmarks.slice(start, start + pageSize)
  }, [filteredBookmarks, currentPage, pageSize])

  // 统计
  const stats = useMemo(() => {
    const newTagsSet = new Set<string>()
    bookmarks.forEach(b => {
      b.tags.forEach(t => {
        if (t.isNew) newTagsSet.add(t.name)
      })
    })
    return {
      total: bookmarks.length,
      filtered: filteredBookmarks.length,
      newTags: newTagsSet.size,
      selected: bookmarks.filter(b => b.isSelected).length
    }
  }, [bookmarks, filteredBookmarks])

  // 更新书签
  const updateBookmark = (index: number, updates: Partial<EditableBookmark>) => {
    const newBookmarks = [...bookmarks]
    newBookmarks[index] = { ...newBookmarks[index], ...updates }
    onBookmarksChange(newBookmarks)
  }

  // 添加标签
  const handleAddTag = (index: number) => {
    const tagName = prompt('输入标签名称：')
    if (!tagName || !tagName.trim()) return

    const bookmark = bookmarks[index]
    if (bookmark.tags.some(t => t.name === tagName.trim())) {
      alert('标签已存在')
      return
    }

    const isNew = !existingTags.includes(tagName.trim())
    updateBookmark(index, {
      tags: [...bookmark.tags, { name: tagName.trim(), isNew, confidence: 1.0 }]
    })
  }

  // 删除标签
  const handleRemoveTag = (bookmarkIndex: number, tagIndex: number) => {
    const bookmark = bookmarks[bookmarkIndex]
    const newTags = bookmark.tags.filter((_, i) => i !== tagIndex)
    updateBookmark(bookmarkIndex, { tags: newTags })
  }

  // 开始编辑标题
  const handleStartEditTitle = (index: number) => {
    setEditingIndex(index)
    setEditingTitle(bookmarks[index].title)
  }

  // 保存标题
  const handleSaveTitle = (index: number) => {
    if (editingTitle.trim()) {
      updateBookmark(index, { title: editingTitle.trim() })
    }
    setEditingIndex(null)
  }

  // 全选/反选
  const handleToggleAll = () => {
    const allSelected = paginatedBookmarks.every(b => b.isSelected)
    const newBookmarks = bookmarks.map(b => {
      if (paginatedBookmarks.includes(b)) {
        return { ...b, isSelected: !allSelected }
      }
      return b
    })
    onBookmarksChange(newBookmarks)
  }

  // 批量添加标签
  const handleBatchAddTag = () => {
    const tagName = prompt('为选中的书签添加标签：')
    if (!tagName || !tagName.trim()) return

    const isNew = !existingTags.includes(tagName.trim())
    const newBookmarks = bookmarks.map(b => {
      if (b.isSelected && !b.tags.some(t => t.name === tagName.trim())) {
        return {
          ...b,
          tags: [...b.tags, { name: tagName.trim(), isNew, confidence: 1.0 }]
        }
      }
      return b
    })
    onBookmarksChange(newBookmarks)
  }

  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-600">总计：</span>
            <span className="font-medium">{stats.total}</span>
          </div>
          {searchQuery && (
            <div>
              <span className="text-gray-600">筛选：</span>
              <span className="font-medium">{stats.filtered}</span>
            </div>
          )}
          <div>
            <span className="text-gray-600">新标签：</span>
            <span className="font-medium text-blue-600">{stats.newTags}</span>
          </div>
          {stats.selected > 0 && (
            <div>
              <span className="text-gray-600">已选：</span>
              <span className="font-medium text-green-600">{stats.selected}</span>
            </div>
          )}
        </div>
      </div>

      {/* 搜索和批量操作 */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="搜索 URL、标题或标签..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
        </div>
        {stats.selected > 0 && (
          <button
            onClick={handleBatchAddTag}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
          >
            批量添加标签
          </button>
        )}
      </div>

      {/* 表格 */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={paginatedBookmarks.length > 0 && paginatedBookmarks.every(b => b.isSelected)}
                  onChange={handleToggleAll}
                  className="w-4 h-4"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">URL</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">标题</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">标签</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {paginatedBookmarks.map((bookmark) => {
              const actualIndex = bookmarks.indexOf(bookmark)
              const isEditing = editingIndex === actualIndex

              return (
                <tr key={actualIndex} className="hover:bg-gray-50">
                  {/* 选择框 */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={bookmark.isSelected || false}
                      onChange={() => updateBookmark(actualIndex, { isSelected: !bookmark.isSelected })}
                      className="w-4 h-4"
                    />
                  </td>

                  {/* URL */}
                  <td className="px-4 py-3">
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline max-w-xs truncate block"
                      title={bookmark.url}
                    >
                      {bookmark.url}
                    </a>
                  </td>

                  {/* 标题 */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle(actualIndex)
                            if (e.key === 'Escape') setEditingIndex(null)
                          }}
                          className="flex-1 px-2 py-1 text-sm border rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveTitle(actualIndex)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="text-sm">{bookmark.title}</span>
                        <button
                          onClick={() => handleStartEditTitle(actualIndex)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* 标签 */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {bookmark.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                            tag.isNew 
                              ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {tag.name}
                          <button
                            onClick={() => handleRemoveTag(actualIndex, tagIndex)}
                            className="hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={() => handleAddTag(actualIndex)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-dashed border-gray-300 rounded-full hover:border-blue-500 hover:text-blue-600"
                      >
                        <Plus className="w-3 h-3" />
                        添加
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredBookmarks.length)} / {filteredBookmarks.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
