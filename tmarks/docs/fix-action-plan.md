# TMarks 修复行动计划

**创建日期:** 2024-12-07  
**目标:** 修复所有硬编码颜色和潜在 Bug  
**预计完成:** 2024-12-14

---

## 🎯 Phase 3 - 本周必须完成

### 任务清单

#### 1. ErrorDisplay.tsx - 完全重构颜色系统 ⏰ 2小时

**文件:** `tmarks/src/components/common/ErrorDisplay.tsx`

**修改内容:**

```tsx
// 修改前
const variantConfig = {
  error: {
    containerClass: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    iconClass: 'text-red-600 dark:text-red-400',
    titleClass: 'text-red-800 dark:text-red-200',
    textClass: 'text-red-700 dark:text-red-300',
    icon: AlertCircle
  },
  // ... 其他变体
}

// 修改后
const variantConfig = {
  error: {
    containerClass: 'bg-destructive/10 border-destructive/20',
    iconClass: 'text-destructive',
    titleClass: 'text-destructive',
    textClass: 'text-destructive/90',
    icon: AlertCircle
  },
  warning: {
    containerClass: 'bg-warning/10 border-warning/20',
    iconClass: 'text-warning',
    titleClass: 'text-warning',
    textClass: 'text-warning/90',
    icon: AlertTriangle
  },
  info: {
    containerClass: 'bg-primary/10 border-primary/20',
    iconClass: 'text-primary',
    titleClass: 'text-primary',
    textClass: 'text-primary/90',
    icon: Info
  },
  success: {
    containerClass: 'bg-success/10 border-success/20',
    iconClass: 'text-success',
    titleClass: 'text-success',
    textClass: 'text-success/90',
    icon: CheckCircle
  }
}
```

**测试:**
- [ ] 测试所有 4 种变体（error, warning, info, success）
- [ ] 测试亮色/暗色主题切换
- [ ] 测试 default/orange 颜色主题切换

---

#### 2. ProgressIndicator.tsx - 完成剩余修复 ⏰ 1.5小时

**文件:** `tmarks/src/components/common/ProgressIndicator.tsx`

**修改内容:**

```tsx
// 1. 修复图标颜色
// 修改前
<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
<Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />

// 修改后
<CheckCircle className="h-5 w-5 text-success" />
<Loader2 className="h-5 w-5 text-primary animate-spin" />

// 2. 修复文本颜色
// 修改前
<h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
<p className="text-xs text-gray-600 dark:text-gray-400">

// 修改后
<h4 className="text-sm font-semibold text-foreground">
<p className="text-xs text-muted-foreground">

// 3. 修复进度条
// 修改前
<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full">
  <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500">

// 修改后
<div className="w-full bg-muted rounded-full">
  <div className="bg-gradient-to-r from-primary to-primary/90">

// 4. 修复 SimpleProgress 组件
// 修改前
const colorClasses = {
  blue: 'bg-blue-600 dark:bg-blue-400',
  green: 'bg-green-600 dark:bg-green-400',
  red: 'bg-red-600 dark:bg-red-400',
  yellow: 'bg-yellow-600 dark:bg-yellow-400'
}

// 修改后
const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  destructive: 'bg-destructive',
  warning: 'bg-warning'
}
```

**测试:**
- [ ] 测试详细进度指示器
- [ ] 测试紧凑进度指示器
- [ ] 测试简单进度条（所有颜色）
- [ ] 测试圆形进度指示器

---

#### 3. ShareDialog.tsx - 修复遮罩层 ⏰ 0.5小时

**文件:** `tmarks/src/components/tab-groups/ShareDialog.tsx`

**修改内容:**

```tsx
// 修改前
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">

// 修改后
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
```

**需要修改的位置:**
- [ ] 删除确认对话框遮罩（第 194 行）
- [ ] 复制失败提示遮罩（第 221 行）

---

#### 4. Drawer.tsx - 修复遮罩层 ⏰ 0.5小时

**文件:** `tmarks/src/components/common/Drawer.tsx`

**修改内容:**

```tsx
// 修改前
<div className="fixed inset-0 bg-black/50 transition-opacity duration-300">

// 修改后
<div className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300">
```

---

#### 5. 清理调试日志 ⏰ 1小时

**需要修改的文件:**

1. **tmarks/src/services/tab-groups.ts**
```tsx
// 删除或改为
logger.log('[tabGroupsService] API response:', response.data)
```

2. **所有 console.error 改为 logger.error**
   - 使用全局搜索替换
   - 确保所有错误都有用户反馈

**清理清单:**
- [ ] tab-groups.ts - 删除调试日志
- [ ] 所有文件 - console.error → logger.error
- [ ] 所有文件 - console.warn → logger.warn
- [ ] 所有文件 - console.log → logger.log

---

### Phase 3 验收标准

- [ ] 所有修改的组件通过 TypeScript 编译
- [ ] 所有修改的组件通过 ESLint 检查
- [ ] 在亮色主题下正常显示
- [ ] 在暗色主题下正常显示
- [ ] 在 default 颜色主题下正常显示
- [ ] 在 orange 颜色主题下正常显示
- [ ] 没有 console 语句（除了 logger）
- [ ] 所有异步操作都有错误处理

---

## 🚀 Phase 4 - 下周完成

### 任务清单

#### 1. SnapshotViewer.tsx ⏰ 0.5小时

```tsx
// 修改前
className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 
  hover:bg-blue-100 dark:hover:bg-blue-900/30"

// 修改后
className="bg-primary/10 text-primary hover:bg-primary/20"
```

---

#### 2. DragDropUpload.tsx ⏰ 0.5小时

```tsx
// 修改前
<div className="absolute inset-0 bg-black bg-opacity-5 rounded-lg pointer-events-none" />

// 修改后
<div className="absolute inset-0 bg-muted/20 rounded-lg pointer-events-none" />
```

---

#### 3. useTabGroupMenu.ts - 重构所有硬编码 ⏰ 3小时

**这是最复杂的修复，需要重构整个预览窗口的样式**

```tsx
// 修改前
const style = `
  body {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  .preview-container {
    background: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
  .status {
    background: rgba(255, 255, 255, 0.2);
  }
  .links-container {
    background: rgba(0, 0, 0, 0.2);
  }
  .link-item {
    background: rgba(255, 255, 255, 0.1);
  }
  .link-item.opened {
    background: rgba(76, 175, 80, 0.3);
  }
  .link-item.failed {
    background: rgba(244, 67, 54, 0.3);
  }
`;

// 修改后 - 使用主题变量
const getThemeStyles = () => {
  const root = document.documentElement;
  const primary = getComputedStyle(root).getPropertyValue('--primary');
  const accent = getComputedStyle(root).getPropertyValue('--accent');
  const card = getComputedStyle(root).getPropertyValue('--card');
  const muted = getComputedStyle(root).getPropertyValue('--muted');
  const success = getComputedStyle(root).getPropertyValue('--success');
  const destructive = getComputedStyle(root).getPropertyValue('--destructive');
  
  return `
    body {
      background: linear-gradient(135deg, ${primary} 0%, ${accent} 100%);
    }
    .preview-container {
      background: ${card};
      box-shadow: var(--shadow-lg);
    }
    .status {
      background: ${muted};
    }
    .links-container {
      background: ${muted};
    }
    .link-item {
      background: ${card};
    }
    .link-item.opened {
      background: color-mix(in srgb, ${success} 30%, transparent);
    }
    .link-item.failed {
      background: color-mix(in srgb, ${destructive} 30%, transparent);
    }
  `;
};
```

**测试:**
- [ ] 批量打开标签页功能正常
- [ ] 预览窗口样式正确
- [ ] 成功/失败状态颜色正确
- [ ] 主题切换时颜色正确

---

#### 4. 添加统一错误处理 ⏰ 2小时

**创建新文件:** `tmarks/src/lib/error-handler.ts`

```tsx
import { logger } from './logger';
import { useToastStore } from '@/stores/toastStore';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  toastMessage?: string;
  logError?: boolean;
  rethrow?: boolean;
}

export function handleError(
  error: unknown,
  context: string,
  options: ErrorHandlerOptions = {}
) {
  const {
    showToast = true,
    toastMessage,
    logError = true,
    rethrow = false
  } = options;

  // 记录错误
  if (logError) {
    logger.error(`[${context}]`, error);
  }

  // 显示用户提示
  if (showToast) {
    const message = toastMessage || getErrorMessage(error);
    useToastStore.getState().error(message);
  }

  // 重新抛出错误（用于需要上层处理的情况）
  if (rethrow) {
    throw error;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '操作失败，请重试';
}

// 使用示例
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string,
  options?: ErrorHandlerOptions
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, options);
    }
  }) as T;
}
```

**应用到所有异步操作:**

```tsx
// 修改前
try {
  await deleteItem(id);
  onUpdate();
} catch (error) {
  console.error('Failed to delete:', error);
}

// 修改后
try {
  await deleteItem(id);
  onUpdate();
} catch (error) {
  handleError(error, 'deleteItem', {
    toastMessage: '删除失败，请重试'
  });
}
```

---

### Phase 4 验收标准

- [ ] 所有硬编码颜色已修复
- [ ] 统一错误处理已应用
- [ ] 所有异步操作都有加载状态
- [ ] 用户反馈及时且友好
- [ ] 主题切换完全正常

---

## 🎨 Phase 5 - 优化改进

### 1. 定义全局阴影变量 ⏰ 1小时

**文件:** `tmarks/src/styles/themes/default.css`

```css
/* 添加阴影变量 */
:root[data-color-theme='default'] {
  /* ... 现有变量 ... */
  
  /* 阴影系统 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-float: 0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 5px 15px -3px rgba(0, 0, 0, 0.05);
}

:root[data-color-theme='default'][data-theme='dark'] {
  /* 暗色主题的阴影 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  --shadow-float: 0 10px 30px -5px rgba(0, 0, 0, 0.4), 0 5px 15px -3px rgba(0, 0, 0, 0.3);
}
```

**应用到组件:**

```tsx
// TabGroupTree.tsx & TabItem.tsx
// 修改前
boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'

// 修改后
boxShadow: 'var(--shadow-lg)'
```

---

### 2. 性能优化 ⏰ 3小时

#### 2.1 添加 React.memo

```tsx
// 示例：优化 TabItem 组件
export const TabItem = React.memo(function TabItem({ item, onUpdate }: TabItemProps) {
  // ... 组件代码
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.item.id === nextProps.item.id &&
         prevProps.item.title === nextProps.item.title &&
         prevProps.item.is_pinned === nextProps.item.is_pinned;
});
```

#### 2.2 优化回调函数

```tsx
// 使用 useCallback 避免不必要的重渲染
const handleDelete = useCallback(async (id: string) => {
  try {
    await deleteItem(id);
    onUpdate();
  } catch (error) {
    handleError(error, 'deleteItem');
  }
}, [onUpdate]);
```

#### 2.3 优化计算

```tsx
// 使用 useMemo 缓存计算结果
const filteredItems = useMemo(() => {
  return items.filter(item => item.is_todo === 1);
}, [items]);
```

---

### 3. 可访问性改进 ⏰ 2小时

#### 3.1 添加 aria 标签

```tsx
// 修改前
<button onClick={handleDelete}>
  <Trash2 />
</button>

// 修改后
<button 
  onClick={handleDelete}
  aria-label="删除项目"
  title="删除项目"
>
  <Trash2 aria-hidden="true" />
</button>
```

#### 3.2 添加键盘导航

```tsx
// 添加键盘事件处理
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
};

<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={handleKeyDown}
  aria-label="打开书签"
>
  {/* 内容 */}
</div>
```

---

### 4. 类型安全改进 ⏰ 2小时

#### 4.1 启用严格类型检查

**文件:** `tmarks/tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

#### 4.2 修复类型问题

```tsx
// 修改前
const handleUpdate = (data: any) => {
  // ...
}

// 修改后
interface UpdateData {
  title?: string;
  is_pinned?: number;
  is_todo?: number;
}

const handleUpdate = (data: UpdateData) => {
  // ...
}
```

---

## 🛠️ 工具和自动化

### 1. ESLint 规则配置

**文件:** `tmarks/eslint.config.js`

```js
export default tseslint.config(
  // ... 现有配置 ...
  {
    rules: {
      // ... 现有规则 ...
      
      // 禁止硬编码颜色
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^(bg|text|border)-(white|black|gray|blue|red|green|yellow|purple|pink|indigo)-/]',
          message: '请使用主题变量而不是硬编码颜色类'
        },
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,6}$/]',
          message: '请使用主题变量而不是硬编码 hex 颜色'
        },
        {
          selector: 'Literal[value=/rgba?\\(/]',
          message: '请使用主题变量而不是硬编码 rgb/rgba 颜色'
        }
      ],
      
      // 禁止使用 console
      'no-console': ['warn', {
        allow: ['warn', 'error'] // 允许 console.warn 和 console.error（但应该用 logger）
      }],
      
      // 要求 async 函数有 try-catch
      'no-async-without-await': 'error',
    }
  }
)
```

---

### 2. Git Pre-commit Hook

**文件:** `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# 运行 ESLint
npm run lint

# 检查硬编码颜色
echo "检查硬编码颜色..."
if git diff --cached --name-only | grep -E '\.(tsx?|jsx?)$' | xargs grep -E '(bg|text|border)-(white|black|gray|blue|red|green|yellow|purple|pink|indigo)-[0-9]'; then
  echo "❌ 发现硬编码颜色，请使用主题变量"
  exit 1
fi

echo "✅ 检查通过"
```

---

### 3. VS Code 配置

**文件:** `.vscode/settings.json`

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

---

## 📋 检查清单

### 开发前检查

- [ ] 拉取最新代码
- [ ] 安装依赖
- [ ] 运行开发服务器
- [ ] 确认主题切换正常

### 开发中检查

- [ ] 使用主题变量而不是硬编码颜色
- [ ] 添加适当的错误处理
- [ ] 添加加载状态
- [ ] 添加 aria 标签
- [ ] 使用 TypeScript 类型
- [ ] 避免使用 console

### 提交前检查

- [ ] 运行 `npm run lint`
- [ ] 运行 `npm run type-check`
- [ ] 测试亮色/暗色主题
- [ ] 测试 default/orange 主题
- [ ] 测试移动端和桌面端
- [ ] 检查浏览器控制台无错误
- [ ] 更新相关文档

---

## 📞 需要帮助？

如果在修复过程中遇到问题：

1. 查看 [主题系统文档](../src/styles/themes/README.md)
2. 参考 [已修复的组件](./hardcoded-colors-fix-summary.md)
3. 查看 [审计报告](./comprehensive-audit-report.md)
4. 在 GitHub Issues 中提问

---

**创建者:** Kiro AI Assistant  
**最后更新:** 2024-12-07
