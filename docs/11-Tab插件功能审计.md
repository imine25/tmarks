# Tab 插件功能审计

## 一、核心功能模块

### 1. Popup（弹窗）
**入口**: `tab/src/popup/`

#### 1.1 模式选择器（ModeSelector）
- **书签模式**：保存到 TMarks 书签管理系统
- **NewTab 模式**：保存到浏览器新标签页
- **标签页收集模式**：批量收集当前窗口的标签页

#### 1.2 书签模式（Bookmark Mode）
**功能**：
- 提取当前页面信息（标题、URL、描述、缩略图）
- AI 推荐标签（可选）
- 手动选择/添加标签
- 编辑标题和描述
- 选择是否包含缩略图
- 选择是否创建页面快照
- 保存到 TMarks 服务器

**依赖**：
- TMarks API URL 和 Access Token
- AI 配置（可选）

#### 1.3 NewTab 模式（NewTab Mode）
**功能**：
- 提取当前页面信息
- AI 推荐文件夹（可选）
- 浏览文件夹树
- 选择保存位置
- 保存到浏览器书签（TMarks 根文件夹下）

**特点**：
- 自动同步到浏览器书签
- 支持文件夹层级结构
- 显示当前保存路径

#### 1.4 标签页收集模式（Tab Collection Mode）
**功能**：
- 收集当前窗口所有标签页
- 批量保存为标签页组
- 支持自定义组名
- 保存到 TMarks 服务器

---

### 2. NewTab（新标签页）
**入口**: `tab/src/newtab/`

#### 2.1 核心功能
- **快捷方式网格**：显示书签快捷方式
- **文件夹管理**：支持文件夹嵌套
- **分组系统**：左侧侧边栏分组切换
- **浏览器书签同步**：双向同步
- **TMarks 服务器同步**：跨设备同步

#### 2.2 小组件系统
支持的组件类型：
- `shortcut`：快捷方式
- `bookmarkFolder`：书签文件夹
- `weather`：天气组件
- `clock`：时钟组件
- `todo`：待办事项
- `notes`：备忘录
- `hotsearch`：热搜榜
- `poetry`：每日诗词

#### 2.3 设置面板
**4个标签页**：
1. **常规（General）**
   - 语言设置
   - 个性化（问候语、用户名）
   - 时钟设置
   - 诗词设置
   - 搜索设置
   - 离线缓存

2. **外观（Appearance）**
   - 快捷方式设置（列数、样式）
   - 壁纸设置（纯色、Bing、Unsplash、自定义）

3. **同步（Sync）**
   - TMarks 同步设置
   - 自动刷新置顶书签

4. **AI（AI）**
   - AI 智能整理开关
   - 自定义规则
   - 自定义提示词
   - 限制设置
   - 历史热度分析
   - 层级策略

#### 2.4 浏览器书签同步
**功能**：
- 自动发现书签栏根文件夹
- 创建 TMarks 根文件夹
- 监听书签变更（创建、更新、删除、移动）
- 双向同步：本地 ↔ 浏览器书签
- 写锁机制（避免循环同步）

**核心文件**：
- `tab/src/newtab/features/browser-sync/`

---

### 3. Options（设置页面）
**入口**: `tab/src/options/`

#### 3.1 配置管理
**标签页**：
1. **AI 配置**
   - 选择 AI 提供商（OpenAI、Claude、DeepSeek、智谱、ModelScope、SiliconFlow、iFlow、自定义）
   - 配置 API Key 和 API URL
   - 选择模型
   - 自定义提示词

2. **TMarks 配置**
   - TMarks API URL
   - Access Token
   - 测试连接

3. **用户偏好**
   - 主题（亮色、暗色、自动）
   - 主题风格（default、bw、tmarks）
   - 标签主题（classic、mono、bw）
   - 自动同步
   - 同步间隔
   - 最大推荐标签数
   - 启用 AI
   - 默认包含缩略图
   - 默认创建快照
   - NewTab 文件夹 AI 推荐数量
   - 启用 NewTab AI

4. **导入功能**
   - 从浏览器导出的书签文件导入
   - 支持 HTML 和 JSON 格式
   - 导入到 TMarks

#### 3.2 NewTab 标签管理
**功能**：
- 查看所有 NewTab 标签
- 批量删除标签
- AI 智能整理（已删除）

---

### 4. Background（后台服务）
**入口**: `tab/src/background/`

#### 4.1 消息处理
**支持的消息类型**：

**页面信息提取**：
- `EXTRACT_PAGE_INFO`：提取当前页面信息
- `PING`：检测 Content Script 是否存活

**AI 推荐**：
- `RECOMMEND_TAGS`：推荐标签（TMarks）
- `RECOMMEND_NEWTAB_FOLDER`：推荐 NewTab 文件夹

**NewTab 操作**：
- `SAVE_TO_NEWTAB`：保存书签到 NewTab
- `IMPORT_ALL_BOOKMARKS_TO_NEWTAB`：导入所有书签到 NewTab
- `GET_NEWTAB_FOLDERS`：获取 NewTab 文件夹列表
- `REFRESH_PINNED_BOOKMARKS`：刷新置顶书签

**TMarks 书签操作**：
- `SAVE_BOOKMARK`：保存书签到 TMarks
- `GET_EXISTING_TAGS`：获取已有标签
- `UPDATE_BOOKMARK_TAGS`：更新书签标签
- `UPDATE_BOOKMARK_DESCRIPTION`：更新书签描述
- `CREATE_SNAPSHOT`：创建页面快照

**同步操作**：
- `SYNC_CACHE`：同步缓存

**配置操作**：
- `GET_CONFIG`：获取配置

#### 4.2 定时任务
- **自动同步缓存**：每天 23:00
- **刷新置顶书签**：早上 8:00 或 晚上 22:00（可配置）

#### 4.3 生命周期事件
- `onInstalled`：扩展安装或更新
- `onStartup`：浏览器启动
- `bookmarks.onRemoved`：书签被删除
- `bookmarks.onMoved`：书签被移动

---

### 5. Content Script（内容脚本）
**入口**: `tab/src/content/`

#### 5.1 页面信息提取
**功能**：
- 提取页面标题
- 提取页面 URL
- 提取页面描述（meta description）
- 提取页面内容（正文）
- 提取缩略图（og:image、twitter:image 等）
- 提取 Favicon

**提取器**：
- `extractors/metadata.ts`：元数据提取
- `extractors/content.ts`：内容提取
- `extractors/images.ts`：图片提取

#### 5.2 页面快照
**功能**：
- 捕获完整页面 HTML
- 内联 CSS
- 提取图片
- 内联字体（可选）
- 移除脚本
- 移除隐藏元素（可选）

**实现**：
- `singlefile-capture.ts`：V1 版本
- `singlefile-capture-v2.ts`：V2 版本（支持图片哈希）

---

## 二、数据存储

### 1. 本地存储（chrome.storage.local）

#### NewTab 数据
```typescript
{
  "newtab": {
    shortcuts: Shortcut[]           // 旧版快捷方式（向后兼容）
    shortcutGroups: ShortcutGroup[] // 分组
    shortcutFolders: ShortcutFolder[] // 文件夹
    activeGroupId: string           // 当前激活分组
    settings: NewTabSettings        // 设置
    gridItems: GridItem[]           // 网格项（新版）
  }
}
```

#### TMarks 配置
```typescript
{
  "aiConfig": AIConfig
  "bookmarkSite": BookmarkSiteConfig
  "preferences": UserPreferences
}
```

#### 缓存数据
```typescript
{
  "tmarks_pinned_bookmarks_cache": PinnedBookmark[]
  "newtab_root_folder_id": string
}
```

### 2. 浏览器书签（chrome.bookmarks）
```
书签栏/
├── TMarks/                    (Home 文件夹)
│   ├── 快捷方式1
│   ├── 快捷方式2
│   └── 文件夹A/
│       └── 快捷方式3
├── 工作/                      (分组文件夹)
│   └── 快捷方式4
└── 学习/                      (分组文件夹)
    └── 快捷方式5
```

### 3. TMarks 服务器（D1 数据库）
- `newtab_groups_v2`：分组信息
- `newtab_shortcuts_v2`：快捷方式信息
- `newtab_grid_items`：网格项信息
- `newtab_operations`：操作日志（增量同步）
- `newtab_sync_state`：同步状态
- `bookmarks`：TMarks 书签
- `tags`：标签
- `tab_groups`：标签页组

---

## 三、功能依赖关系

### 1. 必需配置
**TMarks 书签功能**：
- TMarks API URL
- TMarks Access Token

**AI 功能（可选）**：
- AI Provider
- AI API Key
- AI Model

### 2. 功能独立性
**完全独立**：
- NewTab 快捷方式管理（不依赖 TMarks）
- 浏览器书签同步（不依赖 TMarks）
- NewTab 小组件（时钟、天气等）

**依赖 TMarks**：
- Popup 书签模式
- 标签页收集
- TMarks 服务器同步

**依赖 AI**：
- 标签推荐
- 文件夹推荐
- AI 智能整理（已删除）

---

## 四、功能冗余分析

### 1. 书签保存功能
**问题**：Popup 有两种保存模式
- **书签模式**：保存到 TMarks 服务器（需要配置）
- **NewTab 模式**：保存到浏览器书签（不需要配置）

**建议**：
- 保留两种模式，满足不同用户需求
- TMarks 模式：适合需要标签管理和云端同步的用户
- NewTab 模式：适合只需要快速访问的用户

### 2. 导入功能
**当前状态**：
- Options 页面有导入功能（导入到 TMarks）
- 已删除 NewTab 导入功能
- 已删除 AI 批量整理功能

**建议**：
- 保留 TMarks 导入功能
- 考虑添加"从 TMarks 导入到 NewTab"功能

### 3. AI 功能
**当前使用场景**：
1. Popup 书签模式：推荐标签
2. Popup NewTab 模式：推荐文件夹
3. NewTab 设置：AI 智能整理（功能存在但未实现）

**建议**：
- 保留 Popup 的 AI 推荐功能（实用）
- 移除 NewTab 设置中的 AI 智能整理（未实现）

### 4. 标签页收集功能
**当前状态**：
- Popup 有标签页收集模式
- 可以批量收集当前窗口的标签页
- 保存到 TMarks 服务器

**建议**：
- 保留此功能（实用）
- 考虑添加"保存到 NewTab"选项

---

## 五、待优化功能

### 1. NewTab AI 智能整理
**问题**：
- 设置面板有完整的 AI 整理配置
- 但实际整理功能未实现
- 控制台组件存在但无法触发

**建议**：
- 移除 AI 整理相关的设置项
- 或实现完整的 AI 整理功能

### 2. 增量同步
**问题**：
- 架构文档中提到增量同步设计
- 但实际未实现
- 当前是全量同步

**建议**：
- 实现增量同步（操作日志）
- 优化同步性能

### 3. 图标同步
**问题**：
- 图标只存储在本地
- 不同步到服务器
- 多设备间图标不一致

**建议**：
- 将图标上传到服务器或 CDN
- 实现图标同步

### 4. 文件夹同步
**问题**：
- TMarks 服务器不同步文件夹结构
- 只同步快捷方式和分组

**建议**：
- 实现完整的文件夹结构同步
- 或明确说明不支持文件夹同步

---

## 六、功能清理建议

### 1. 立即删除
- [ ] NewTab 设置中的 AI 整理相关配置（未实现）
- [ ] AI 整理控制台组件（无法触发）
- [ ] 未使用的类型定义（已清理部分）

### 2. 考虑删除
- [ ] 标签页收集功能（使用频率低？）
- [ ] 页面快照功能（使用频率低？）
- [ ] 部分小组件（weather、hotsearch、poetry 等）

### 3. 考虑合并
- [ ] Popup 的两种保存模式（书签 + NewTab）
- [ ] Options 的多个配置标签页

---

## 七、核心功能保留建议

### 必须保留
1. **Popup 书签模式**：核心功能
2. **Popup NewTab 模式**：核心功能
3. **NewTab 快捷方式管理**：核心功能
4. **浏览器书签同步**：核心功能
5. **Options 配置管理**：核心功能
6. **Background 消息处理**：核心功能

### 可选保留
1. **标签页收集**：根据使用情况决定
2. **页面快照**：根据使用情况决定
3. **小组件系统**：根据使用情况决定
4. **AI 推荐**：增强功能，建议保留

### 建议移除
1. **NewTab AI 智能整理**：未实现
2. **导入功能的 AI 整理**：已删除
3. **未使用的类型定义**：已清理部分

---

## 八、总结

Tab 插件功能丰富但存在以下问题：
1. **功能未完成**：AI 智能整理有配置但无实现
2. **功能冗余**：两种书签保存模式
3. **同步不完整**：图标、文件夹不同步
4. **代码冗余**：已删除部分，还需继续清理

**优先级建议**：
1. **高优先级**：移除未实现的 AI 整理功能
2. **中优先级**：实现增量同步、图标同步
3. **低优先级**：评估小组件使用情况，考虑精简
