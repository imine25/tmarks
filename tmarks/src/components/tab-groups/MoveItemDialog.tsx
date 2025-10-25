import { useState } from 'react'
import { X, FolderOpen } from 'lucide-react'
import type { TabGroup } from '@/lib/types'

interface MoveItemDialogProps {
  isOpen: boolean
  itemTitle: string
  currentGroupId: string
  availableGroups: TabGroup[]
  onMove: (targetGroupId: string) => void
  onClose: () => void
}

export function MoveItemDialog({
  isOpen,
  itemTitle,
  currentGroupId,
  availableGroups,
  onMove,
  onClose,
}: MoveItemDialogProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')

  if (!isOpen) return null

  // 过滤掉当前组和文件夹
  const targetGroups = availableGroups.filter(
    (g) => g.id !== currentGroupId && g.is_folder !== 1
  )

  const handleMove = () => {
    if (selectedGroupId) {
      onMove(selectedGroupId)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">移动标签页</h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              将 <span className="font-medium text-foreground">"{itemTitle}"</span> 移动到：
            </p>
          </div>

          {/* Group List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {targetGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>没有可用的目标组</p>
              </div>
            ) : (
              targetGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedGroupId === group.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{group.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {group.item_count || 0} 个标签页
                      </p>
                    </div>
                    {selectedGroupId === group.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-2">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleMove}
            disabled={!selectedGroupId}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            移动
          </button>
        </div>
      </div>
    </div>
  )
}
