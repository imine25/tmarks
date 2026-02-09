/**
 * 组件渲染器 - 只渲染 shortcut 和 bookmarkFolder
 */

import { memo } from 'react';
import type { GridItem } from '../../types';
import type { WidgetRendererProps } from './types';
import { getSizeSpan } from './widgetRegistry';
import { ShortcutWidget } from './ShortcutWidget';
import { BookmarkFolderWidget } from './BookmarkFolderWidget';

// 组件映射
const WIDGET_COMPONENTS: Record<string, React.ComponentType<WidgetRendererProps>> = {
  shortcut: ShortcutWidget,
  bookmarkFolder: BookmarkFolderWidget,
};

interface Props {
  item: GridItem;
  onUpdate?: (id: string, updates: Partial<GridItem>) => void;
  onRemove?: (id: string) => void;
  isEditing?: boolean;
  onOpenFolder?: (folderId: string) => void;
  isBatchMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  shortcutStyle?: 'icon' | 'card';
}

export const WidgetRenderer = memo(function WidgetRenderer({
  item,
  onUpdate,
  onRemove,
  isEditing = false,
  onOpenFolder,
  isBatchMode,
  isSelected,
  onToggleSelect,
  shortcutStyle,
}: Props) {
  const Component = WIDGET_COMPONENTS[item.type];
  const { cols, rows } = getSizeSpan(item.size);

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full text-white/50">
        未知组件类型: {item.type}
      </div>
    );
  }

  return (
    <div
      className="widget-container h-full"
      style={{
        gridColumn: `span ${cols}`,
        gridRow: `span ${rows}`,
      }}
    >
      <Component
        item={item}
        onUpdate={onUpdate}
        onRemove={onRemove}
        isEditing={isEditing}
        onOpenFolder={onOpenFolder}
        isBatchMode={isBatchMode}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
        shortcutStyle={shortcutStyle}
      />
    </div>
  );
});
