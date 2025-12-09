import { useState, useRef, useCallback, useEffect } from 'react'
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import type { CollisionDetection, DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { pointerWithin, closestCenter } from '@dnd-kit/core'
import type { TabGroup } from '@/lib/types'
import { logger } from '@/lib/logger'

type DropPosition = 'before' | 'inside' | 'after'

interface UseDragAndDropProps {
  tabGroups: TabGroup[]
  onMoveGroup?: (groupId: string, newParentId: string | null, newPosition: number) => Promise<void>
}

export function useDragAndDrop({ tabGroups, onMoveGroup }: UseDragAndDropProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null)
  const pointerInitialYRef = useRef<number | null>(null)
  const pointerInitialXRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)

  // 清理 RAF
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions && pointerCollisions.length > 0) {
      return pointerCollisions
    }
    return closestCenter(args)
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    pointerInitialYRef.current = event.activatorEvent instanceof PointerEvent 
      ? event.activatorEvent.clientY 
      : null
    pointerInitialXRef.current = event.activatorEvent instanceof PointerEvent 
      ? event.activatorEvent.clientX 
      : null
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
    }
    
    rafIdRef.current = requestAnimationFrame(() => {
      const overId = event.over?.id as string | null
      setOverId(overId)

      if (!overId || !event.over) {
        setDropPosition(null)
        return
      }

      const overGroup = tabGroups.find(g => g.id === overId)
      if (!overGroup) {
        setDropPosition(null)
        return
      }

      const overRect = event.over.rect
      const activeRect = event.active.rect.current
      const initialRect = activeRect.initial

      if (!overRect || !initialRect || overRect.height === 0) {
        setDropPosition(null)
        return
      }

      // 使用当前拖拽位置，而不是初始位置
      const pointerInitialY = pointerInitialYRef.current
      if (pointerInitialY === null) {
        setDropPosition(null)
        return
      }

      // 计算当前鼠标位置 = 初始位置 + 拖拽偏移量
      const deltaY = activeRect.translated ? activeRect.translated.top - initialRect.top : 0
      const currentPointerY = pointerInitialY + deltaY

      const relativeY = currentPointerY - overRect.top
      const relativeYPercent = relativeY / overRect.height

      if (overGroup.is_folder === 1) {
        if (relativeYPercent < 0.25) {
          setDropPosition('before')
        } else if (relativeYPercent > 0.75) {
          setDropPosition('after')
        } else {
          setDropPosition('inside')
        }
      } else {
        if (relativeYPercent < 0.5) {
          setDropPosition('before')
        } else {
          setDropPosition('after')
        }
      }
    })
  }, [tabGroups])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    const currentDropPosition = dropPosition

    setActiveId(null)
    setOverId(null)
    setDropPosition(null)
    pointerInitialYRef.current = null
    pointerInitialXRef.current = null

    if (!over || active.id === over.id || !onMoveGroup) return

    const draggedGroup = tabGroups.find(g => g.id === active.id)
    const targetGroup = tabGroups.find(g => g.id === over.id)

    if (!draggedGroup || !targetGroup) return

    logger.log('🎯 DragEnd:', {
      draggedId: draggedGroup.id,
      draggedTitle: draggedGroup.title,
      targetId: targetGroup.id,
      targetTitle: targetGroup.title,
      dropPosition: currentDropPosition
    })

    // 根据拖放位置决定操作
    if (currentDropPosition === 'inside' && targetGroup.is_folder === 1) {
      // 放入文件夹内部
      if (draggedGroup.is_folder === 1) {
        const isDescendant = (parentId: string, childId: string): boolean => {
          const child = tabGroups.find(g => g.id === childId)
          if (!child || !child.parent_id) return false
          if (child.parent_id === parentId) return true
          return isDescendant(parentId, child.parent_id)
        }

        if (isDescendant(draggedGroup.id, targetGroup.id)) {
          logger.log('  ❌ Cannot move folder into its descendant')
          return
        }
      }

      logger.log('  → Moving inside folder')
      await onMoveGroup(draggedGroup.id, targetGroup.id, 0)
    } else {
      // 移动到同级
      const newParentId = targetGroup.parent_id || null
      const siblings = tabGroups.filter(g => (g.parent_id || null) === newParentId)
      
      let targetIndex = siblings.findIndex(g => g.id === targetGroup.id)
      if (currentDropPosition === 'after') {
        targetIndex++
      }

      const currentIndex = siblings.findIndex(g => g.id === draggedGroup.id)
      if (currentIndex !== -1 && currentIndex < targetIndex) {
        targetIndex--
      }

      const newPosition = Math.max(0, targetIndex)
      logger.log('  → Moving to same parent, new position:', newPosition)
      await onMoveGroup(draggedGroup.id, newParentId, newPosition)
    }
  }, [dropPosition, tabGroups, onMoveGroup])

  const handleDragCancel = useCallback(() => {
    pointerInitialYRef.current = null
    pointerInitialXRef.current = null
    setActiveId(null)
    setOverId(null)
    setDropPosition(null)
  }, [])

  return {
    sensors,
    collisionDetection,
    activeId,
    overId,
    dropPosition,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel
  }
}
