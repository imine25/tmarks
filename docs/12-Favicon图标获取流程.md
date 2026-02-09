# Favicon 图标获取流程详解

## 概述

本文档详细说明了 Tab 插件和 TMarks Web 应用中网址图标（Favicon）的获取、缓存和显示机制。

**最新更新：** 已重构为统一的 Favicon 服务模块，支持多 API 源和智能降级。

---

## 一、新版 Favicon 服务模块

### 1.1 核心服务

位置：`tab/src/lib/services/favicon.ts`

**设计理念：**
- 统一的 API 管理
- 多源智能降级
- 国内外环境适配
- 离线缓存支持
- 批量下载优化

### 1.2 支持的 API 源

按优先级排序：

| 优先级 | API 源 | 特点 | 国内可用 |
|-------|--------|------|---------|
| 1 | Chrome Favicon API | 浏览器内置，最快 | ✅ |
| 2 | Google Favicon API | 稳定可靠 | ✅ |
| 3 | DuckDuckGo Icons | 隐私友好 | ✅ |
| 4 | Favicon.im | 国内镜像 | ✅ |
| 5 | Direct Favicon | 直接访问 | ✅ |
| 6 | Icon.ooo | 高质量 | ❌ 需代理 |

**API 格式：**

```typescript
// Google Favicon API
https://www.google.com/s2/favicons?domain={domain}&sz={size}

// DuckDuckGo Icons
https://icons.duckduckgo.com/ip3/{domain}.ico

// Favicon.im
https://api.favicon.im/{domain}?size={size}

// Chrome Favicon API (仅 Chromium NewTab)
chrome://favicon2/?size={size}&page_url={url}
```

### 1.3 核心 API

**1. getFaviconUrl(options)**

获取 Favicon URL（自动选择最优 API 源）

```typescript
import { getFaviconUrl } from '@/lib/services/favicon';

const url = getFaviconUrl({
  url: 'https://github.com',
  size: 64,
  sources: ['google', 'duckduckgo'], // 可选：指定使用的源
});
```

**2. fetchFavicon(options)**

尝试从多个源获取 Favicon

```typescript
import { fetchFavicon } from '@/lib/services/favicon';

const result = await fetchFavicon({
  url: 'https://github.com',
  size: 64,
});

if (result) {
  console.log('Source:', result.source); // 'google'
  console.log('URL:', result.url);
  console.log('Size:', result.size); // 字节
}
```

**3. downloadFavicon(url, maxSizeKB, sources)**

下载并压缩为 base64

```typescript
import { downloadFavicon } from '@/lib/services/favicon';

const base64 = await downloadFavicon(
  'https://github.com',
  10, // 最大 10KB
  ['google', 'duckduckgo'] // 可选：指定源
);
```

**4. batchDownloadFavicons(options)**

批量下载

```typescript
import { batchDownloadFavicons } from '@/lib/services/favicon';

const result = await batchDownloadFavicons({
  shortcuts: [
    { id: '1', url: 'https://github.com' },
    { id: '2', url: 'https://google.com' },
  ],
  maxSizeKB: 10,
  sources: ['google'], // 可选
  onProgress: (current, total, id) => {
    console.log(`${current}/${total}: ${id}`);
  },
  delayMs: 100, // 请求间隔
});

console.log('Success:', result.success.size);
console.log('Failed:', result.failed.size);
console.log('Skipped:', result.skipped.size);
```

### 1.4 兼容层

位置：`tab/src/newtab/utils/favicon.ts`

为保持向后兼容，旧的 API 仍然可用，但内部已切换到新服务：

```typescript
// 旧 API（仍可用）
import { getFaviconUrl } from '@/newtab/utils/favicon';

const url = getFaviconUrl({
  url: 'https://github.com',
  faviconBase64: 'data:image/png;base64,...', // 优先使用
  favicon: 'https://...', // 次优先
});
```

---

## 二、组件中的使用

### 2.1 ShortcutWidget（快捷方式组件）

位置：`tab/src/newtab/components/widgets/ShortcutWidget.tsx`

**回退策略：**

```typescript
const favicon = getFaviconUrl(shortcut); // 自动选择最优源
const [imgSrc, setImgSrc] = useState(favicon);

const handleImgError = useCallback(() => {
  // 失败时回退到 Google Favicon API
  if (!triedIconRef.current) {
    triedIconRef.current = true;
    const domain = new URL(shortcut.url).hostname;
    const googleSrc = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    setImgSrc(googleSrc);
    return;
  }
  
  // 最终失败：显示首字母
  setImgError(true);
}, [imgSrc, shortcut.url]);
```

**显示逻辑：**
1. 加载中：骨架屏
2. 加载成功：显示图标
3. 第一次失败：回退到 Google API
4. 最终失败：显示首字母

### 2.2 BookmarkFolderWidget（文件夹组件）

位置：`tab/src/newtab/components/widgets/BookmarkFolderWidget.tsx`

使用相同的回退策略，支持 3x3 网格显示文件夹内的图标缩略图。

---

## 三、为什么不用梯子无法获取图标？

### 3.1 旧版问题

**旧版使用的 API：**
- 主要：`icon.ooo` ❌ 在国内被墙
- 回退：`chrome://favicon2/` ✅ 仅限 Chromium NewTab

**问题：**
- Firefox 浏览器无法使用 `chrome://favicon2/`
- Popup 页面无法使用 `chrome://favicon2/`
- 非 NewTab 页面无法使用 `chrome://favicon2/`
- 所有这些场景都会回退到 `icon.ooo`，导致无法访问

### 3.2 新版解决方案

**新版使用的 API：**
1. Chrome Favicon API（Chromium NewTab）✅
2. **Google Favicon API**（主要回退）✅ 国内可用
3. DuckDuckGo Icons ✅ 国内可用
4. Favicon.im ✅ 国内镜像
5. Direct Favicon ✅ 直接访问
6. Icon.ooo（最后回退）❌ 需代理

**优势：**
- 多个国内可用的 API 源
- 智能降级策略
- 不依赖梯子即可正常使用

---

## 四、最佳实践

### 4.1 推荐配置

**国内用户：**
```typescript
const url = getFaviconUrl({
  url: 'https://github.com',
  sources: ['google', 'duckduckgo', 'favicon-im'],
});
```

**国外用户：**
```typescript
const url = getFaviconUrl({
  url: 'https://github.com',
  sources: ['google', 'icon-ooo'],
});
```

### 4.2 性能优化

1. **使用本地缓存**
   ```typescript
   if (shortcut.faviconBase64) {
     return shortcut.faviconBase64; // 最快
   }
   ```

2. **批量下载**
   ```typescript
   const result = await batchDownloadFavicons({
     shortcuts,
     delayMs: 100, // 避免请求过快
   });
   ```

3. **懒加载**
   ```tsx
   <img loading="lazy" src={favicon} />
   ```

### 4.3 错误处理

```tsx
const [imgError, setImgError] = useState(false);

<img
  src={favicon}
  onError={() => {
    // 回退到 Google API
    setImgSrc(googleFaviconUrl);
  }}
/>

{imgError && (
  <div className="fallback">
    {initial} {/* 显示首字母 */}
  </div>
)}
```

---

## 五、API 源测试

### 5.1 测试单个源

```typescript
import { testSourceAvailability } from '@/lib/services/favicon';

const available = await testSourceAvailability('google', 'github.com');
console.log('Google API available:', available);
```

### 5.2 测试所有源

```typescript
import { getAllSourcesStatus } from '@/lib/services/favicon';

const status = await getAllSourcesStatus();
status.forEach(s => {
  console.log(`${s.name}: ${s.tested ? '✅' : '❌'}`);
});
```

---

## 六、总结

### 6.1 新版优势

- ✅ 多 API 源支持（6 个）
- ✅ 智能降级策略
- ✅ 国内外环境适配
- ✅ 统一的服务接口
- ✅ 完善的错误处理
- ✅ 批量下载优化
- ✅ 离线缓存支持

### 6.2 迁移指南

**旧代码：**
```typescript
import { getFaviconUrl } from '@/newtab/utils/favicon';
const url = getFaviconUrl(shortcut);
```

**新代码（推荐）：**
```typescript
import { getFaviconUrl } from '@/lib/services/favicon';
const url = getFaviconUrl({ url: shortcut.url, size: 64 });
```

**兼容性：** 旧 API 仍然可用，内部已切换到新服务。
