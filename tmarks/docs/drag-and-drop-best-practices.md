# 拖拽功能最佳实践

## 概述

本文档总结了业界大厂（Notion、Trello、Linear、GitHub Projects）的拖拽实现最佳实践，以及我们项目的改进方向。

## 一、技术选型

### 我们的选择：@dnd-kit ✅

**优点：**
- 现代化、性能优秀
- TypeScript 原生支持
- 无障碍友好（支持键盘操作）
- 灵活的传感器系统
- 活跃的社区维护

**替代方案对比：**
- `react-beautiful-dnd`: 功能强大但性能较差，已停止维护
- `react-dnd`: 老牌库，但 API 复杂
- `@atlaskit/pragmatic-drag-and-drop`: Atlassian 新推出，值得关注

## 二、核心实现要点

### 1. 激活约束（Activation Constraint）

**目的：** 防止误触，区分点击和拖拽

```typescript
useSensor(PointerSensor, {
  activationConstraint: {
    distance: 8, // 移动 8px 后才开始拖拽
    delay: 0,    // 移动端可设置延迟（如 250ms）
    tolerance: 5, // 容差
  },
})
```

**大厂实践：**
- **Notion**: 8-10px 距离触发
- **Trello**: 5px 距离 + 100ms 延迟（移动端）
- **Linear**: 10px 距离，极快响应

### 2. 碰撞检测算法

**我们的实现：**
```typescript
const collisionDetection: CollisionDetection = (args) => {
  // 1. 优先使用指针位置检测（最精确）
  const pointerCollisions = pointerWithin(args)
  if (pointerCollisions?.length > 0) {
    return pointerCollisions
  }
  
  // 2. 后备：最近中心点检测
  return closestCenter(args)
}
```

**大厂实践：**
- **Notion**: 自定义算法，考虑元素层级和嵌套
- **Trello**: 使用 `closestCorners` 处理列表边界
- **Linear**: 高度优化的自定义算法，支持虚拟滚动

### 3. 视觉反馈

#### 3.1 拖拽中的元素

**当前实现：**
```typescript
const style = {
  opacity: isDragging ? 0.5 : 1,
  transition: 'opacity 0.2s ease',
}
```

**改进建议：**
```typescript
const style = {
  opacity: isDragging ? 0.4 : 1,
  transform: isDragging ? 'scale(1.05)' : 'scale(1)',
  boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
  transition: 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
  cursor: isDragging ? 'grabbing' : 'grab',
}
```

**大厂实践：**
- **Notion**: 半透明 + 轻微放大 + 阴影
- **Trello**: 旋转 2-3 度 + 阴影
- **Linear**: 极简风格，只改变透明度和阴影

#### 3.2 插入位置指示器

**推荐实现：**
```tsx
// Notion 风格的插入线
<div className="absolute left-0 right-0 h-0.5 bg-blue-500">
  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
</div>

// Trello 风格的占位符
<div className="h-20 bg-gray-200 rounded-lg border-2 border-dashed border-gray-400" />

// Linear 风格的高亮
<div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 rounded-lg" />
```

### 4. 性能优化

#### 4.1 节流和防抖

```typescript
import { throttle } from 'lodash-es'

const handleDragOver = throttle((event: DragOverEvent) => {
  // 处理拖拽悬停
}, 16) // 约 60fps
```

#### 4.2 使用 requestAnimationFrame

```typescript
const rafIdRef = useRef<number | null>(null)

const updatePosition = (callback: () => void) => {
  if (rafIdRef.current) {
    cancelAnimationFrame(rafIdRef.current)
  }
  
  rafIdRef.current = requestAnimationFrame(() => {
    callback()
    rafIdRef.current = null
  })
}
```

#### 4.3 虚拟滚动（大量数据）

**适用场景：** 超过 100 个可拖拽项

**推荐库：**
- `react-window`
- `react-virtual`
- `@tanstack/react-virtual`

**示例：**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60, // 每项高度
  overscan: 5, // 预渲染项数
})
```

#### 4.4 React.memo 优化

```typescript
const DraggableItem = memo(({ item }: { item: Item }) => {
  // 组件实现
}, (prev, next) => {
  // 自定义比较函数
  return prev.item.id === next.item.id && 
         prev.item.position === next.item.position
})
```

### 5. 移动端优化

#### 5.1 长按触发

```typescript
useSensor(PointerSensor, {
  activationConstraint: {
    delay: 250,      // 长按 250ms
    tolerance: 5,    // 5px 容差
  },
})
```

#### 5.2 触觉反馈

```typescript
const triggerHaptic = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate(50) // 50ms 震动
  }
}

// 在拖拽开始时调用
onDragStart={() => {
  triggerHaptic()
}}
```

#### 5.3 触摸优化

```typescript
// 防止页面滚动干扰拖拽
useEffect(() => {
  if (isDragging) {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
  } else {
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
  }
}, [isDragging])
```

### 6. 自动滚动

**实现：**
```typescript
const handleAutoScroll = (clientY: number) => {
  const container = containerRef.current
  if (!container) return
  
  const rect = container.getBoundingClientRect()
  const edgeThreshold = 50 // 边缘阈值
  const scrollSpeed = 10   // 滚动速度
  
  const distanceFromTop = clientY - rect.top
  const distanceFromBottom = rect.bottom - clientY
  
  if (distanceFromTop < edgeThreshold) {
    container.scrollTop -= scrollSpeed
  } else if (distanceFromBottom < edgeThreshold) {
    container.scrollTop += scrollSpeed
  }
}
```

**大厂实践：**
- **Notion**: 渐进式加速，越靠近边缘滚动越快
- **Trello**: 固定速度，简单可靠
- **Linear**: 智能预测，提前滚动

### 7. 键盘支持（无障碍）

```typescript
useSensor(KeyboardSensor, {
  coordinateGetter: sortableKeyboardCoordinates,
})

// 快捷键
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    cancelDrag()
  }
  if (event.key === 'Enter' || event.key === ' ') {
    confirmDrop()
  }
}
```

**大厂实践：**
- **Notion**: 完整的键盘导航支持
- **Linear**: 快捷键 + 命令面板
- **GitHub**: 标准的 ARIA 属性

## 三、高级功能

### 1. 批量拖拽

```typescript
const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

const handleDragStart = (event: DragStartEvent) => {
  const draggedId = event.active.id as string
  
  // 如果拖拽的项在选中集合中，拖拽所有选中项
  if (selectedItems.has(draggedId)) {
    // 拖拽多个项
  } else {
    // 拖拽单个项
  }
}
```

### 2. 撤销/重做

```typescript
const [history, setHistory] = useState<State[]>([])
const [currentIndex, setCurrentIndex] = useState(-1)

const undo = () => {
  if (currentIndex > 0) {
    setCurrentIndex(currentIndex - 1)
    restoreState(history[currentIndex - 1])
  }
}

const redo = () => {
  if (currentIndex < history.length - 1) {
    setCurrentIndex(currentIndex + 1)
    restoreState(history[currentIndex + 1])
  }
}
```

### 3. 拖拽预览自定义

```typescript
<DragOverlay>
  {activeId ? (
    <CustomPreview
      item={items.find(i => i.id === activeId)}
      count={selectedItems.size}
    />
  ) : null}
</DragOverlay>

const CustomPreview = ({ item, count }) => (
  <div className="relative">
    <ItemCard item={item} />
    {count > 1 && (
      <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
        {count}
      </div>
    )}
  </div>
)
```

## 四、测试建议

### 1. 单元测试

```typescript
import { render, screen } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'

test('should trigger drag start', () => {
  const onDragStart = jest.fn()
  
  render(
    <DndContext onDragStart={onDragStart}>
      <DraggableItem id="1" />
    </DndContext>
  )
  
  // 模拟拖拽
  // ...
  
  expect(onDragStart).toHaveBeenCalled()
})
```

### 2. E2E 测试

```typescript
// Playwright 示例
test('should reorder items by drag and drop', async ({ page }) => {
  await page.goto('/tab-groups')
  
  const firstItem = page.locator('[data-testid="item-1"]')
  const secondItem = page.locator('[data-testid="item-2"]')
  
  await firstItem.dragTo(secondItem)
  
  // 验证顺序改变
  const items = await page.locator('[data-testid^="item-"]').allTextContents()
  expect(items[0]).toBe('Item 2')
  expect(items[1]).toBe('Item 1')
})
```

## 五、性能指标

### 目标性能

- **拖拽响应时间**: < 16ms (60fps)
- **拖拽开始延迟**: < 100ms
- **位置更新频率**: 60fps
- **内存占用**: < 50MB (1000 项)

### 性能监控

```typescript
const measureDragPerformance = () => {
  const startTime = performance.now()
  
  return () => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (duration > 16) {
      console.warn(`Drag operation took ${duration}ms (target: 16ms)`)
    }
  }
}
```

## 六、常见问题

### 1. 拖拽时页面滚动

**解决方案：**
```typescript
useEffect(() => {
  if (isDragging) {
    document.body.style.overflow = 'hidden'
  }
  return () => {
    document.body.style.overflow = ''
  }
}, [isDragging])
```

### 2. 移动端拖拽不灵敏

**解决方案：**
- 增加激活延迟（250ms）
- 添加触觉反馈
- 使用长按触发

### 3. 拖拽时卡顿

**解决方案：**
- 使用 `React.memo` 优化组件
- 节流 `onDragOver` 事件
- 使用虚拟滚动
- 减少 DOM 操作

### 4. 嵌套拖拽冲突

**解决方案：**
```typescript
const handleDragStart = (event: DragStartEvent) => {
  event.stopPropagation() // 阻止事件冒泡
}
```

## 七、参考资源

### 官方文档
- [@dnd-kit 文档](https://docs.dndkit.com/)
- [React DnD 文档](https://react-dnd.github.io/react-dnd/)

### 开源项目
- [Notion Clone](https://github.com/konstantinmuenster/notion-clone)
- [Trello Clone](https://github.com/reedbarger/trello-clone)
- [Linear Clone](https://github.com/linear-app/linear)

### 文章
- [Building a Drag and Drop List](https://www.joshwcomeau.com/react/beautiful-dnd/)
- [Optimizing Drag and Drop Performance](https://web.dev/drag-and-drop/)

## 八、我们的改进计划

### 短期（1-2 周）
- [x] 添加插入线指示器
- [x] 优化拖拽性能（节流）
- [ ] 添加移动端长按支持
- [ ] 改进视觉反馈

### 中期（1 个月）
- [ ] 实现自动滚动
- [ ] 添加批量拖拽
- [ ] 优化移动端体验
- [ ] 添加键盘快捷键

### 长期（3 个月）
- [ ] 实现虚拟滚动（大数据量）
- [ ] 添加撤销/重做
- [ ] 完善无障碍支持
- [ ] 性能监控和优化

---

**最后更新：** 2024-12-07
**维护者：** TMarks 团队
