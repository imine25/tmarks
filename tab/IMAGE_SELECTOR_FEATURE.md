# 图片选择功能

## 功能说明

浏览器插件现在支持从网页中抓取多张图片，并允许用户在保存书签时选择使用哪一张作为封面图。

## 实现细节

### 1. 图片抓取逻辑 (content script)

插件会按以下优先级抓取图片：

1. **Open Graph 图片** (`og:image` meta标签)
2. **Twitter 图片** (`twitter:image` meta标签)
3. **页面大图** (从main、article等区域查找，按面积排序取前5张)

所有抓取到的图片URL会存储在 `PageInfo.thumbnails` 数组中。

### 2. 图片选择界面

在popup的书签预览卡片中：

- **单张图片**：正常显示，无切换按钮
- **多张图片**：
  - 鼠标悬停时显示左右切换按钮
  - 左下角显示当前图片序号 (如 "2 / 5")
  - 点击左右箭头可切换图片
  - 切换后的图片会自动更新为当前选中的封面图

### 3. 用户体验

- **视觉反馈**：
  - 切换按钮使用半透明黑色背景，悬停时更明显
  - 图片计数器显示当前位置
  - 平滑的过渡动画

- **交互设计**：
  - 按钮仅在鼠标悬停时显示，不遮挡图片内容
  - 使用 lucide-react 的线性图标，风格统一
  - 支持循环切换（最后一张→第一张，第一张→最后一张）

## 技术实现

### 类型定义

```typescript
export interface PageInfo {
  title: string;
  url: string;
  description?: string;
  content?: string;
  thumbnail?: string;      // 当前选中的图片
  thumbnails?: string[];   // 所有可用的图片
}
```

### 组件接口

```typescript
interface PageInfoCardProps {
  title: string;
  url: string;
  description?: string;
  thumbnail?: string;
  thumbnails?: string[];
  onThumbnailChange?: (thumbnail: string) => void;
}
```

## 使用场景

1. **新闻网站**：通常有多张配图，用户可选择最相关的图片
2. **博客文章**：可能有多张插图，用户可选择最具代表性的
3. **产品页面**：有多张产品图，用户可选择最喜欢的角度
4. **社交媒体**：帖子中的多张图片，用户可选择最重要的

## 优化建议

未来可以考虑的改进：

1. **缩略图预览**：在底部显示所有图片的小缩略图
2. **键盘快捷键**：支持左右箭头键切换
3. **图片质量检测**：自动过滤低质量或重复的图片
4. **智能推荐**：使用AI分析图片内容，推荐最相关的图片
5. **手动上传**：允许用户上传自定义封面图

## 注意事项

- 图片URL必须是http/https协议
- 自动过滤data URL和blob URL
- 图片尺寸限制：200px < 宽/高 < 5000px
- 最多保存5张页面大图（避免性能问题）
