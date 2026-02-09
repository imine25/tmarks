/**
 * 组件注册表 - 只保留 shortcut 和 bookmarkFolder
 */

import type { GridItemType, GridItemSize } from '../../types';

// 获取尺寸的列数和行数
export function getSizeSpan(size: GridItemSize): { cols: number; rows: number } {
  const [cols, rows] = size.split('x').map(Number);
  return { cols, rows };
}

// 获取组件默认配置（保留为空函数）
export function getDefaultWidgetConfig(_type: GridItemType): Record<string, any> {
  return {};
}

// 获取组件元数据（保留为空函数）
export function getWidgetMeta(_type: GridItemType): any {
  return null;
}
