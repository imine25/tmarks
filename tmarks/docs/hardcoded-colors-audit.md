# TMarks 硬编码颜色审计报告

## 📋 审计概述

**审计日期:** 2024-12-07  
**审计范围:** tmarks/src 目录下所有 TypeScript/TSX/CSS 文件  
**问题类型:** 硬编码颜色、未使用主题变量

---

## 🔴 严重问题（必须修复）

### 1. MobileBottomNav.tsx - 大量硬编码颜色

**文件:** `tmarks/src/components/layout/MobileBottomNav.tsx`

**问题:**
```tsx
// ❌ 硬编码的颜色类
bg-white dark:bg-gray-800
border-gray-200 dark:border-gray-700
text-blue-600 dark:text-blue-400
text-gray-500 dark:text-gray-400
bg-red-500 text-white
```

**应该改为:**
```tsx
// ✅ 使用主题变量
bg-card
border-border
text-primary
text-muted-foreground
bg-destructive text-destructive-foreground
```

**影响:** 高 - 移动端导航栏在所有页面显示

---

### 2. ProgressIndicator.tsx - 硬编码进度条颜色

**文件:** `tmarks/src/components/common/ProgressIndicator.tsx`

**问题:**
```tsx
// ❌ 硬编码
text-green-600 dark:text-green-400  // 完成状态
text-blue-600 dark:text-blue-400    // 进行中状态
bg-gray-200 dark:bg-gray-700        // 进度条背景
bg-blue-600 dark:bg-blue-400        // 进度条填充
```

**应该改为:**
```tsx
// ✅ 使用主题变量
text-success           // 完成状态
text-primary          // 进行中状态
bg-muted              // 进度条背景
bg-primary            // 进度条填充
```

**影响:** 中 - 影响所有进度显示

---

### 3. ErrorDisplay.tsx - 硬编码错误提示颜色

**文件:** `tmarks/src/components/common/ErrorDisplay.tsx`

**问题:**
```tsx
// ❌ 硬编码
hover:bg-black/5 dark:hover:bg-white/5
bg-black/10 dark:bg-white/10
```

**应该改为:**
```tsx
// ✅ 使用主题变量
hover:bg-muted/50
bg-muted/30
```

**影响:** 中 - 影响错误提示的交互反馈

---

### 4. ShareDialog.tsx - 硬编码遮罩层

**文件:** `tmarks/src/components/tab-groups/ShareDialog.tsx`

**问题:**
```tsx
// ❌ 硬编码
bg-black/50  // 遮罩层
```

**应该改为:**
```tsx
// ✅ 使用主题变量
bg-background/80 backdrop-blur-sm
```

**影响:** 低 - 仅影响分享对话框

---

### 5. Drawer.tsx - 硬编码抽屉遮罩

**文件:** `tmarks/src/components/common/Drawer.tsx`

**问题:**
```tsx
// ❌ 硬编码
bg-black/50
```

**应该改为:**
```tsx
// ✅ 使用主题变量
bg-background/80 backdrop-blur-sm
```

**影响:** 中 - 影响所有抽屉组件

---

### 6. DragDropUpload.tsx - 硬编码拖拽覆盖层

**文件:** `tmarks/src/components/common/DragDropUpload.tsx`

**问题:**
```tsx
// ❌ 硬编码
bg-black bg-opacity-5
```

**应该改为:**
```tsx
// ✅ 使用主题变量
bg-muted/20
```

**影响:** 低 - 仅影响文件上传组件

---

## 🟡 中等问题（建议修复）

### 7. TabGroupTree.tsx & TabItem.tsx - 硬编码阴影

**文件:** 
- `tmarks/src/components/tab-groups/TabGroupTree.tsx`
- `tmarks/src/components/tab-groups/TabItem.tsx`

**问题:**
```tsx
// ❌ 硬编码 rgba
boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)'
```

**应该改为:**
```tsx
// ✅ 使用 CSS 变量或 Tailwind 类
className="shadow-lg"  // 或 shadow-xl
// 或在 CSS 中定义
boxShadow: 'var(--shadow-lg)'
```

**影响:** 低 - 仅影响拖拽时的视觉效果

---

### 8. useTabGroupMenu.ts - 硬编码渐变背景

**文件:** `tmarks/src/hooks/useTabGroupMenu.ts`

**问题:**
```tsx
// ❌ 硬编码渐变
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
background: rgba(255, 255, 255, 0.1);
background: rgba(0, 0, 0, 0.2);
```

**应该改为:**
```tsx
// ✅ 使用主题变量
background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
background: var(--card);
```

**影响:** 低 - 仅影响批量打开标签页的预览窗口

---

## 🟢 低优先级问题（可选修复）

### 9. components.css - 硬编码阴影

**文件:** `tmarks/src/styles/components.css`

**问题:**
```css
/* ❌ 硬编码 rgba */
box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1);
.modal::backdrop {
  background: rgba(0, 0, 0, 0.5);
}
```

**说明:** 这些是全局样式，使用 rgba 是合理的，但可以考虑使用 CSS 变量统一管理。

**建议:**
```css
/* ✅ 使用 CSS 变量 */
:root {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --backdrop: rgba(0, 0, 0, 0.5);
}

[data-theme='dark'] {
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
  --backdrop: rgba(0, 0, 0, 0.7);
}
```

**影响:** 低 - 全局样式，当前实现可接受

---

## ✅ 无需修复

### Mock 数据中的颜色

**文件:** 
- `tmarks/src/mock/tagData.ts`
- `tmarks/src/mock/bookmarkData.ts`

**说明:** Mock 数据中的颜色是模拟真实数据，不需要修复。

---

## 📊 统计总结

| 优先级 | 文件数 | 问题数 | 状态 |
|--------|--------|--------|------|
| 🔴 严重 | 6 | 15+ | 待修复 |
| 🟡 中等 | 3 | 10+ | 建议修复 |
| 🟢 低 | 1 | 5+ | 可选 |
| ✅ 无需 | 2 | - | 忽略 |

---

## 🎯 修复优先级建议

### Phase 1 - 立即修复（本周）

1. ✅ **MobileBottomNav.tsx** - 移动端导航栏
2. ✅ **ProgressIndicator.tsx** - 进度指示器
3. ✅ **ErrorDisplay.tsx** - 错误提示

### Phase 2 - 尽快修复（下周）

4. ✅ **ShareDialog.tsx** - 分享对话框
5. ✅ **Drawer.tsx** - 抽屉组件
6. ✅ **DragDropUpload.tsx** - 文件上传

### Phase 3 - 优化改进（有时间时）

7. ⚠️ **TabGroupTree.tsx & TabItem.tsx** - 拖拽阴影
8. ⚠️ **useTabGroupMenu.ts** - 批量打开预览
9. ⚠️ **components.css** - 全局阴影变量

---

## 🛠️ 修复指南

### 主题变量对照表

| 硬编码颜色 | 主题变量 | 用途 |
|-----------|---------|------|
| `bg-white` / `bg-gray-800` | `bg-card` | 卡片背景 |
| `text-gray-900` / `text-gray-100` | `text-foreground` | 主要文本 |
| `text-gray-500` / `text-gray-400` | `text-muted-foreground` | 次要文本 |
| `border-gray-200` / `border-gray-700` | `border-border` | 边框 |
| `bg-blue-600` / `bg-blue-400` | `bg-primary` | 主色 |
| `text-blue-600` / `text-blue-400` | `text-primary` | 主色文本 |
| `bg-red-500` | `bg-destructive` | 错误/危险 |
| `bg-green-600` / `bg-green-400` | `bg-success` | 成功 |
| `bg-gray-100` / `bg-gray-700` | `bg-muted` | 静音背景 |
| `bg-black/50` | `bg-background/80 backdrop-blur-sm` | 遮罩层 |

### 修复模板

```tsx
// ❌ 修复前
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  <button className="bg-blue-600 hover:bg-blue-700 text-white">
    Click me
  </button>
</div>

// ✅ 修复后
<div className="bg-card text-foreground">
  <button className="bg-primary hover:bg-primary/90 text-primary-foreground">
    Click me
  </button>
</div>
```

---

## 📝 注意事项

1. **渐进式修复** - 不要一次性修改所有文件，按优先级逐步修复
2. **测试主题切换** - 修复后测试亮色/暗色主题切换
3. **测试颜色主题** - 测试 default 和 orange 两个颜色主题
4. **保持一致性** - 确保相同功能使用相同的主题变量
5. **文档更新** - 修复后更新相关文档

---

## 🔗 相关资源

- [主题变量定义](../src/styles/themes/default.css)
- [Tailwind 配置](../tailwind.config.js)
- [组件样式](../src/styles/components.css)

---

**最后更新:** 2024-12-07  
**维护者:** Kiro AI Assistant
