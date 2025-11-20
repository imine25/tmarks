# 网站Logo/Favicon获取功能

## 功能说明

浏览器插件现在可以自动获取网站的高清logo/favicon，并在书签预览卡片中显示。

## 浏览器获取网站Logo的方式

### 1. Apple Touch Icon（优先级最高）
```html
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```
- 通常是180x180或更大的高清图标
- 专为iOS设备设计，但质量最好
- 支持多种尺寸，自动选择最大的

### 2. 标准Icon标签
```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="shortcut icon" href="/favicon.ico">
```
- SVG格式优先（矢量图，无损缩放）
- PNG格式次之（选择最大尺寸）
- 支持多种格式和尺寸

### 3. Chrome Favicon API
```
chrome://favicon/size/64@2x/https://example.com
```
- Chrome内置的favicon服务
- 支持高清显示（@2x表示Retina屏幕）
- 自动缓存和优化

### 4. 标准favicon.ico
```
https://example.com/favicon.ico
```
- 最传统的方式
- 作为最后的回退方案

## 实现逻辑

```typescript
getFavicon() {
  // 1. 尝试 Apple Touch Icon (180x180+)
  // 2. 尝试标准 icon 标签 (SVG > PNG > 其他)
  // 3. 使用 Chrome Favicon API (64@2x)
  // 4. 回退到 /favicon.ico
}
```

### 优先级策略

1. **Apple Touch Icon**
   - 查找所有 `rel="apple-touch-icon"` 的链接
   - 优先选择带 `sizes` 属性的最大尺寸
   - 通常质量最好（180x180或更大）

2. **标准Icon**
   - SVG格式优先（矢量图，无损缩放）
   - PNG格式次之（选择最大尺寸）
   - 其他格式作为备选

3. **Chrome API**
   - 使用 `chrome://favicon/size/64@2x/` 获取高清图标
   - Chrome会自动处理缓存和优化
   - 支持Retina屏幕的2倍分辨率

4. **标准路径**
   - 回退到 `/favicon.ico`
   - 最传统但最可靠的方式

## 显示效果

在书签预览卡片中：
- Favicon显示在标题左侧
- 尺寸：20x20px（w-5 h-5）
- 圆角处理（rounded）
- 加载失败时自动隐藏

```tsx
<div className="flex items-start gap-2">
  {favicon && (
    <img
      src={favicon}
      alt=""
      className="w-5 h-5 flex-shrink-0 mt-0.5 rounded"
      onError={(e) => e.currentTarget.style.display = 'none'}
    />
  )}
  <h3 className="flex-1 text-base font-semibold">
    {title}
  </h3>
</div>
```

## 使用场景

1. **品牌识别**：快速识别网站来源
2. **视觉美化**：提升书签卡片的视觉效果
3. **用户体验**：更直观的网站标识

## 技术细节

### URL解析
- 支持相对路径和绝对路径
- 自动处理baseURL
- 验证协议（只接受http/https）
- 错误处理和日志记录

### 类型安全
```typescript
export interface PageInfo {
  title: string;
  url: string;
  description?: string;
  content?: string;
  thumbnail?: string;
  thumbnails?: string[];
  favicon?: string;  // 新增
}
```

### 错误处理
- 每个步骤都有try-catch保护
- 图片加载失败时自动隐藏
- 不影响其他功能的正常运行

## 浏览器兼容性

- ✅ Chrome/Edge - 完全支持
- ✅ Firefox - 支持（需调整Chrome API部分）
- ✅ Safari - 支持
- ✅ Opera/Brave - 支持

## 性能优化

1. **优先级策略**：先尝试高质量图标，避免不必要的请求
2. **Chrome缓存**：利用浏览器内置的favicon缓存
3. **懒加载**：图片加载失败不影响页面渲染
4. **错误处理**：快速失败，不阻塞其他功能

## 未来改进

1. **Google Favicon Service**：作为额外的回退方案
   ```
   https://www.google.com/s2/favicons?domain=example.com&sz=128
   ```

2. **本地缓存**：缓存已获取的favicon，减少重复请求

3. **自定义上传**：允许用户手动上传或选择favicon

4. **智能选择**：使用AI分析图标质量，自动选择最佳图标

5. **批量获取**：在标签页收集功能中批量获取所有标签的favicon
