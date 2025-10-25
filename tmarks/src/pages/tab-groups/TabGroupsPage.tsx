import { useState, useEffect, useRef, useMemo } from 'react'
import { tabGroupsService } from '@/services/tab-groups'
import { logger } from '@/lib/logger'
import type { TabGroup, TabGroupItem } from '@/lib/types'
import { ShareDialog } from '@/components/tab-groups/ShareDialog'
import { sortTabGroups, type SortOption } from '@/components/tab-groups/SortSelector'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { SearchBar } from '@/components/tab-groups/SearchBar'
import { BatchActionBar } from '@/components/tab-groups/BatchActionBar'
import { EmptyState } from '@/components/tab-groups/EmptyState'
import { TabGroupHeader } from '@/components/tab-groups/TabGroupHeader'
import { TabItemList } from '@/components/tab-groups/TabItemList'
import { TabGroupTree } from '@/components/tab-groups/TabGroupTree'
import { TodoSidebar } from '@/components/tab-groups/TodoSidebar'
import { ResizablePanel } from '@/components/common/ResizablePanel'
import { arrayMove } from '@dnd-kit/sortable'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useTabGroupActions } from '@/hooks/useTabGroupActions'
import { useBatchActions } from '@/hooks/useBatchActions'
import { searchInFields } from '@/lib/search-utils'
import { MoveItemDialog } from '@/components/tab-groups/MoveItemDialog'

export function TabGroupsPage() {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [highlightedDomain, setHighlightedDomain] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [batchMode, setBatchMode] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('created')
  const [sharingGroupId, setSharingGroupId] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const searchCleanupTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Move item dialog state
  const [moveItemDialog, setMoveItemDialog] = useState<{
    isOpen: boolean
    item: TabGroupItem | null
    currentGroupId: string
  }>({
    isOpen: false,
    item: null,
    currentGroupId: '',
  })

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  // Use custom hooks
  const {
    editingItemId,
    setEditingItemId,
    editingTitle,
    setEditingTitle,
    editingGroupId,
    setEditingGroupId,
    editingGroupTitle,
    setEditingGroupTitle,
    handleDelete,
    handleOpenAll,
    handleExportMarkdown,
    handleEditGroup,
    handleSaveGroupEdit,
    handleEditItem,
    handleSaveEdit,
    handleTogglePin,
    handleToggleTodo,
    handleDeleteItem,
  } = useTabGroupActions({
    setTabGroups,
    setDeletingId,
    setConfirmDialog,
    confirmDialog,
  })

  const {
    handleBatchDelete,
    handleBatchPin,
    handleBatchTodo,
    handleBatchExport,
    handleDeselectAll,
  } = useBatchActions({
    tabGroups,
    setTabGroups,
    selectedItems,
    setSelectedItems,
    setConfirmDialog,
    confirmDialog,
  })

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 移动 8px 后才开始拖拽
      },
    }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    loadTabGroups()
  }, [])

  // 搜索防抖：延迟300ms更新实际搜索关键词
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // 搜索自动清空
  useEffect(() => {
    // 清除之前的定时器
    if (searchCleanupTimerRef.current) {
      clearTimeout(searchCleanupTimerRef.current)
      searchCleanupTimerRef.current = null
    }

    // 如果有搜索关键词，设置15秒后自动清空
    if (searchQuery.trim()) {
      searchCleanupTimerRef.current = setTimeout(() => {
        setSearchQuery('')
        setDebouncedSearchQuery('')
      }, 15000) // 15秒
    }

    // 清理函数
    return () => {
      if (searchCleanupTimerRef.current) {
        clearTimeout(searchCleanupTimerRef.current)
        searchCleanupTimerRef.current = null
      }
    }
  }, [searchQuery])

  const loadTabGroups = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const groups = await tabGroupsService.getAllTabGroups()
      setTabGroups(groups)
    } catch (err) {
      logger.error('Failed to load tab groups:', err)
      setError('加载标签页组失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 只刷新左侧树形列表，不影响中间和右侧列
  const refreshTreeOnly = async () => {
    try {
      const groups = await tabGroupsService.getAllTabGroups()
      // 保持当前选中的分组不变
      const currentSelectedGroup = selectedGroupId
        ? groups.find(g => g.id === selectedGroupId)
        : null

      setTabGroups(groups)

      // 如果当前选中的分组仍然存在，保持选中状态
      // 这样中间列的内容不会改变
      if (currentSelectedGroup) {
        // 不需要重新设置 selectedGroupId，因为它没有改变
        // 中间列会继续显示相同的内容
      }
    } catch (err) {
      logger.error('Failed to refresh tree:', err)
      setError('刷新失败')
    }
  }

  const handleCreateFolder = async () => {
    try {
      await tabGroupsService.createFolder('新文件夹')
      // 只刷新左侧树形列表
      await refreshTreeOnly()
    } catch (err) {
      logger.error('Failed to create folder:', err)
      setError('创建文件夹失败')
    }
  }

  const handleRenameGroup = async (groupId: string, newTitle: string) => {
    try {
      await tabGroupsService.updateTabGroup(groupId, { title: newTitle })
      // 只刷新左侧树形列表
      await refreshTreeOnly()
    } catch (err) {
      logger.error('Failed to rename group:', err)
      setError('重命名失败')
    }
  }

  const handleMoveGroup = async (groupId: string, newParentId: string | null, newPosition: number) => {
    try {
      logger.log('📦 handleMoveGroup:', { groupId, newParentId, newPosition })

      // 获取拖拽项
      const draggedGroup = tabGroups.find(g => g.id === groupId)
      if (!draggedGroup) {
        logger.error('Dragged group not found')
        return
      }

      // 获取同级所有项（包括拖拽项）
      const siblings = tabGroups.filter(g =>
        (g.parent_id || null) === newParentId
      )

      // 按当前 position 排序
      siblings.sort((a, b) => (a.position || 0) - (b.position || 0))

      // 移除拖拽项（如果在同级中）
      const draggedIndex = siblings.findIndex(g => g.id === groupId)
      if (draggedIndex !== -1) {
        siblings.splice(draggedIndex, 1)
      }

      // 插入到新位置
      siblings.splice(newPosition, 0, draggedGroup)

      // 重新分配 position（从 0 开始）
      const updates = siblings.map((g, index) => ({
        id: g.id,
        position: index,
        parent_id: newParentId
      }))

      logger.log('  → Reordering', updates.length, 'items')

      // 批量更新
      await Promise.all(
        updates.map(update =>
          tabGroupsService.updateTabGroup(update.id, {
            position: update.position,
            parent_id: update.parent_id
          })
        )
      )

      // 只刷新左侧树形列表，不影响中间和右侧列
      await refreshTreeOnly()
    } catch (err) {
      logger.error('Failed to move group:', err)
      setError('移动失败')
    }
  }

  const handleItemClick = (item: TabGroupItem, e: React.MouseEvent) => {
    if (batchMode) {
      e.preventDefault()
      const newSelected = new Set(selectedItems)
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id)
      } else {
        newSelected.add(item.id)
      }
      setSelectedItems(newSelected)
      return
    }

    const domain = extractDomain(item.url)
    if (highlightedDomain === domain) {
      setHighlightedDomain(null)
    } else {
      setHighlightedDomain(domain)
    }
  }

  const extractDomain = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return ''
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    // 查找拖拽的项目和目标项目
    let sourceGroup: TabGroup | undefined
    let sourceItem: TabGroupItem | undefined
    let targetGroup: TabGroup | undefined
    let targetItem: TabGroupItem | undefined

    // 找到源项目和源组
    for (const group of tabGroups) {
      const item = group.items?.find((i) => i.id === active.id)
      if (item) {
        sourceGroup = group
        sourceItem = item
        break
      }
    }

    // 找到目标项目和目标组
    for (const group of tabGroups) {
      const item = group.items?.find((i) => i.id === over.id)
      if (item) {
        targetGroup = group
        targetItem = item
        break
      }
    }

    if (!sourceGroup || !sourceItem || !targetGroup || !targetItem) return

    // 同一个组内移动
    if (sourceGroup.id === targetGroup.id) {
      const oldIndex = sourceGroup.items!.findIndex((item) => item.id === active.id)
      const newIndex = sourceGroup.items!.findIndex((item) => item.id === over.id)

      const newItems = arrayMove(sourceGroup.items!, oldIndex, newIndex)

      // Update local state immediately
      setTabGroups((prev) =>
        prev.map((g) =>
          g.id === sourceGroup.id ? { ...g, items: newItems } : g
        )
      )

      // Update positions in backend
      try {
        await Promise.all(
          newItems.map((item: TabGroupItem, index: number) =>
            tabGroupsService.updateTabGroupItem(item.id, { position: index })
          )
        )
      } catch (err) {
        logger.error('Failed to update positions:', err)
        // Revert on error
        setTabGroups((prev) =>
          prev.map((g) =>
            g.id === sourceGroup.id ? { ...g, items: sourceGroup.items } : g
          )
        )
      }
    } else {
      // 跨组移动
      const targetIndex = targetGroup.items!.findIndex((item) => item.id === over.id)

      // 从源组移除
      const newSourceItems = sourceGroup.items!.filter((item) => item.id !== active.id)

      // 添加到目标组
      const newTargetItems = [...targetGroup.items!]
      newTargetItems.splice(targetIndex, 0, sourceItem)

      // Update local state immediately
      setTabGroups((prev) =>
        prev.map((g) => {
          if (g.id === sourceGroup.id) {
            return { ...g, items: newSourceItems, item_count: newSourceItems.length }
          }
          if (g.id === targetGroup.id) {
            return { ...g, items: newTargetItems, item_count: newTargetItems.length }
          }
          return g
        })
      )

      // Update backend
      try {
        // 使用专门的移动 API
        await tabGroupsService.moveTabGroupItem(sourceItem.id, targetGroup.id, targetIndex)

        // 更新源组剩余项目的 position
        await Promise.all(
          newSourceItems.map((item: TabGroupItem, index: number) =>
            tabGroupsService.updateTabGroupItem(item.id, { position: index })
          )
        )

        logger.log('✅ Item moved across groups successfully')
      } catch (err) {
        logger.error('Failed to move item across groups:', err)
        // Revert on error
        setTabGroups((prev) =>
          prev.map((g) => {
            if (g.id === sourceGroup.id) {
              return { ...g, items: sourceGroup.items, item_count: sourceGroup.items!.length }
            }
            if (g.id === targetGroup.id) {
              return { ...g, items: targetGroup.items, item_count: targetGroup.items!.length }
            }
            return g
          })
        )
      }
    }
  }

  // 打开移动对话框
  const handleMoveItem = (item: TabGroupItem) => {
    // 找到当前项目所属的组
    const currentGroup = tabGroups.find((g) => g.items?.some((i) => i.id === item.id))
    if (currentGroup) {
      setMoveItemDialog({
        isOpen: true,
        item,
        currentGroupId: currentGroup.id,
      })
    }
  }

  // 执行移动操作
  const handleMoveItemToGroup = async (targetGroupId: string) => {
    const { item, currentGroupId } = moveItemDialog
    if (!item) return

    const sourceGroup = tabGroups.find((g) => g.id === currentGroupId)
    const targetGroup = tabGroups.find((g) => g.id === targetGroupId)

    if (!sourceGroup || !targetGroup) return

    // 从源组移除
    const newSourceItems = sourceGroup.items!.filter((i) => i.id !== item.id)

    // 添加到目标组末尾
    const newTargetItems = [...(targetGroup.items || []), item]

    // Update local state immediately
    setTabGroups((prev) =>
      prev.map((g) => {
        if (g.id === currentGroupId) {
          return { ...g, items: newSourceItems, item_count: newSourceItems.length }
        }
        if (g.id === targetGroupId) {
          return { ...g, items: newTargetItems, item_count: newTargetItems.length }
        }
        return g
      })
    )

    // Update backend
    try {
      // 使用专门的移动 API，移动到目标组末尾
      await tabGroupsService.moveTabGroupItem(item.id, targetGroupId, newTargetItems.length - 1)

      // 更新源组剩余项目的 position
      await Promise.all(
        newSourceItems.map((i: TabGroupItem, index: number) =>
          tabGroupsService.updateTabGroupItem(i.id, { position: index })
        )
      )

      logger.log('✅ Item moved to group successfully')
    } catch (err) {
      logger.error('Failed to move item to group:', err)
      // Revert on error
      setTabGroups((prev) =>
        prev.map((g) => {
          if (g.id === currentGroupId) {
            return { ...g, items: sourceGroup.items, item_count: sourceGroup.items!.length }
          }
          if (g.id === targetGroupId) {
            return { ...g, items: targetGroup.items, item_count: targetGroup.items?.length || 0 }
          }
          return g
        })
      )
    }
  }

  // 使用 useMemo 缓存筛选结果，避免每次渲染都重新计算
  // 注意：必须在所有提前返回之前调用 hooks
  const groupFilteredTabGroups = useMemo(() => {
    if (!tabGroups || tabGroups.length === 0) {
      return []
    }
    
    if (!selectedGroupId) {
      return tabGroups
    }
    
    const selectedGroup = tabGroups.find(g => g.id === selectedGroupId)
    if (!selectedGroup) {
      return []
    }
    
    // 如果选中的是文件夹，显示文件夹本身和所有子项
    if (selectedGroup.is_folder === 1) {
      const children = tabGroups.filter(g => g.parent_id === selectedGroupId)
      return [selectedGroup, ...children]
    }
    
    // 如果选中的是普通分组，只显示该分组
    return [selectedGroup]
  }, [selectedGroupId, tabGroups])

  // 使用防抖后的搜索关键词进行筛选（高性能版）
  const filteredTabGroups = useMemo(() => {
    if (!groupFilteredTabGroups || groupFilteredTabGroups.length === 0) {
      return []
    }
    
    if (!debouncedSearchQuery.trim()) {
      return groupFilteredTabGroups
    }

    const query = debouncedSearchQuery
    const results: TabGroup[] = []
    
    for (const group of groupFilteredTabGroups) {
      // 使用优化的搜索函数
      const matchesTitle = searchInFields([group.title], query)
      
      if (matchesTitle) {
        // 标题匹配，保留所有 items
        results.push(group)
      } else if (group.items && group.items.length > 0) {
        // 标题不匹配，筛选 items（批量搜索标题和URL）
        const filteredItems = group.items.filter((item) =>
          searchInFields([item.title, item.url], query)
        )
        
        if (filteredItems.length > 0) {
          // 只在有匹配的 items 时才创建新对象
          results.push({
            ...group,
            items: filteredItems,
          })
        }
      }
    }
    
    return results
  }, [groupFilteredTabGroups, debouncedSearchQuery])

  // 使用 useMemo 缓存排序结果
  const sortedGroups = useMemo(() => {
    if (!filteredTabGroups || filteredTabGroups.length === 0) {
      return []
    }
    return sortTabGroups(filteredTabGroups, sortBy)
  }, [filteredTabGroups, sortBy])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            加载中...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadTabGroups}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            style={{ color: 'var(--foreground)' }}
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 左侧导航栏 */}
      <ResizablePanel
        side="left"
        defaultWidth={240}
        minWidth={200}
        maxWidth={400}
        storageKey="tab-groups-left-sidebar-width"
      >
        <TabGroupTree
          tabGroups={tabGroups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          onCreateFolder={handleCreateFolder}
          onRenameGroup={handleRenameGroup}
          onMoveGroup={handleMoveGroup}
          onRefresh={refreshTreeOnly}
        />
      </ResizablePanel>

      {/* 中间内容区域 */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="mb-6">
            {/* Title and Search Bar in one row */}
            {tabGroups.length > 0 && (
              <div className="flex items-center gap-4 w-full">
                <h1 className="text-xl font-semibold text-foreground whitespace-nowrap flex-shrink-0">
                  标签页组
                </h1>
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onBatchModeToggle={() => setBatchMode(!batchMode)}
                  batchMode={batchMode}
                />
              </div>
            )}

            {/* Batch Action Bar */}
            {batchMode && selectedItems.size > 0 && (
              <div className="mt-4">
                <BatchActionBar
                  selectedCount={selectedItems.size}
                  onSelectAll={() => {
                    // Select all items from all groups
                    const allItemIds = new Set<string>()
                    tabGroups.forEach((group) => {
                      group.items?.forEach((item) => {
                        allItemIds.add(item.id)
                      })
                    })
                    setSelectedItems(allItemIds)
                  }}
                  onDeselectAll={handleDeselectAll}
                  onBatchDelete={handleBatchDelete}
                  onBatchPin={handleBatchPin}
                  onBatchTodo={handleBatchTodo}
                  onBatchExport={handleBatchExport}
                  onCancel={() => {
                    setBatchMode(false)
                    setSelectedItems(new Set())
                  }}
                />
              </div>
            )}
          </div>

      {/* Empty State */}
      {tabGroups.length === 0 && <EmptyState isSearching={false} searchQuery="" />}

      {/* No Search Results */}
      {tabGroups.length > 0 && filteredTabGroups.length === 0 && (
        <EmptyState isSearching={true} searchQuery={searchQuery} />
      )}

      {/* Tab Groups Grid */}
      {sortedGroups.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-6">
            {sortedGroups.map((group) => {
              return (
                <div
                  key={group.id}
                  className="card border-l-4 border-l-primary p-6 hover:shadow-xl transition-all duration-200"
                >
                {/* Header */}
                <TabGroupHeader
                  group={group}
                  isEditingTitle={editingGroupId === group.id}
                  editingTitle={editingGroupTitle}
                  onEditTitle={() => handleEditGroup(group)}
                  onSaveTitle={() => handleSaveGroupEdit(group.id)}
                  onCancelEdit={() => {
                    setEditingGroupId(null)
                    setEditingGroupTitle('')
                  }}
                  onTitleChange={setEditingGroupTitle}
                  onOpenAll={() => handleOpenAll(group.items || [])}
                  onExport={() => handleExportMarkdown(group)}
                  onDelete={() => handleDelete(group.id, group.title)}
                  isDeleting={deletingId === group.id}
                  onShareClick={() => setSharingGroupId(group.id)}
                />

                {/* Tab Items List */}
                {group.items && group.items.length > 0 && (
                  <TabItemList
                    items={group.items}
                    groupId={group.id}
                    highlightedDomain={highlightedDomain}
                    selectedItems={selectedItems}
                    batchMode={batchMode}
                    editingItemId={editingItemId}
                    editingTitle={editingTitle}
                    onItemClick={handleItemClick}
                    onEditItem={handleEditItem}
                    onSaveEdit={handleSaveEdit}
                    onTogglePin={handleTogglePin}
                    onToggleTodo={handleToggleTodo}
                    onDeleteItem={handleDeleteItem}
                    onMoveItem={handleMoveItem}
                    setEditingItemId={setEditingItemId}
                    setEditingTitle={setEditingTitle}
                    extractDomain={extractDomain}
                  />
                )}
              </div>
              )
            })}
          </div>
        </DndContext>
      )}

      {/* Share Dialog */}
      {sharingGroupId && (
        <ShareDialog
          groupId={sharingGroupId}
          groupTitle={tabGroups.find((g) => g.id === sharingGroupId)?.title || ''}
          onClose={() => setSharingGroupId(null)}
        />
      )}

      {/* Move Item Dialog */}
      <MoveItemDialog
        isOpen={moveItemDialog.isOpen}
        itemTitle={moveItemDialog.item?.title || ''}
        currentGroupId={moveItemDialog.currentGroupId}
        availableGroups={tabGroups}
        onMove={handleMoveItemToGroup}
        onClose={() =>
          setMoveItemDialog({
            isOpen: false,
            item: null,
            currentGroupId: '',
          })
        }
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
        </div>
      </div>

      {/* 右侧TODO栏 */}
      <ResizablePanel
        side="right"
        defaultWidth={320}
        minWidth={280}
        maxWidth={500}
        storageKey="tab-groups-right-sidebar-width"
      >
        <TodoSidebar
          tabGroups={tabGroups}
          onUpdate={loadTabGroups}
        />
      </ResizablePanel>
    </div>
  )
}
