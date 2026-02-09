/**
 * 组件系统 - 导出入口
 */

export { WidgetRenderer } from './WidgetRenderer';
export { ShortcutWidget } from './ShortcutWidget';
export { BookmarkFolderWidget } from './BookmarkFolderWidget';
export {
  getWidgetMeta,
  getDefaultWidgetConfig,
  getSizeSpan,
} from './widgetRegistry';
export type { WidgetProps, WidgetRendererProps } from './types';
