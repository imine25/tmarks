/**
 * NewTab z-index 层级常量
 * 合理分布各组件的层级，避免冲突
 */

export const Z_INDEX = {
  // 侧边栏层 (20-29)
  SIDEBAR: 20,
  
  // 编辑模式层 (30-39)
  EDIT_BUTTONS: 30,
  
  // 底部 Dock 层 (40-49)
  DOCK: 40,
  
  // 下拉菜单/Tooltip 层 (50-59)
  DROPDOWN: 50,
  TOOLTIP: 55,
  SEARCH_DROPDOWN: 50,
  
  // 小弹窗层 (60-69)
  POPOVER: 60,
  ADD_GROUP_MENU: 65,
  
  // 模态框层 (100-119)
  MODAL_BACKDROP: 100,
  MODAL_CONTENT: 110,
  
  // 批量编辑底栏 (120-129) - 需要在模态框之上
  BATCH_EDIT_BAR: 120,

  DRAG_OVERLAY: 1000,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
