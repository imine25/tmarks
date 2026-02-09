# NewTab 架构梳理

## 一、整体架构

### 1.1 核心定位
NewTab 是一个**浏览器新标签页扩展**，提供：
- 快捷方式管理（网格布局）
- 浏览器书签同步
- 多种小组件（时钟、天气、待办、热搜等）
- 壁纸和主题定制
- 多设备数据同步

### 1.2 技术栈
- **前端框架**：React + TypeScript
- **状态管理**：Zustand
- **样式**：Tailwind CSS + UnoCSS
- **构建工具**：Vite
- **浏览器 API**：Chrome Bookmarks API
- **后端同步**：Cloudflare Workers + D1

---

## 二、目录结构

```
tab/src/newtab/
├── components/              # UI 组件
│   ├── grid/               # 网格布局组件
│   ├── settings/           # 设置面板组件
│   ├── widgets/            # 小组件（时钟、天气等）
│   ├── WidgetGrid/         # 网格容器
│   ├── Clock.tsx           # 时钟
│   ├── SearchBar.tsx       # 搜索框
│   ├── DockBar.tsx         # 底部 Dock 栏
│   ├── GroupSidebar.tsx    # 左侧分组侧边栏
│   ├── Wallpaper.tsx       # 壁纸背景
│   └── ...
├── features/               # 功能模块
│   └── browser-sync/       # 浏览器书签同步
│       ├── api.ts          # Chrome Bookmarks API 封装
│       ├── root-folder.ts  # 根文件夹管理
│       ├── home-folder.ts  # Home 文件夹管理
│       ├── listeners.ts    # 书签变更监听
│       ├── transform.ts    # 数据转换
│       └── hooks/          # 同步相关 Hooks
├── hooks/                  # 状态管理 Hooks
│   ├── store/              # Zustand Store 模块
│   │   ├── actions/        # 拆分的 Actions
│   │   └── sync.ts         # 同步逻辑
│   ├── useNewtabStore.ts   # 主 Store
│   └── useTMarksSync.ts    # TMarks 同步 Hook
├── services/               # 服务层
│   └── tmarks-sync.ts      # TMarks 同步服务
├── utils/                  # 工具函数
│   ├── favicon.ts          # 图标获取
│   ├── syncQueue.ts        # 同步队列
│   └── errorHandler.ts     # 错误处理
├── constants.ts            # 常量定义
├── types.ts                # 类型定义
├── NewTab.tsx              # 主组件
└── index.tsx               # 入口文件
```

---

## 三、数据模型

### 3.1 核心数据结构

#### GridItem（网格项）
```typescript
interface GridItem {
  id: string                      // 唯一标识
  type: GridItemType              // 类型：shortcut/bookmarkFolder/weather/clock等
  size: GridItemSize              // 尺寸：1x1/2x1/1x2/2x2等
  position: number                // 排序位置
  groupId?: string                // 所属分组
  parentId?: string               // 父级ID（文件夹嵌套）
  browserBookmarkId?: string      // 浏览器书签ID
  tmarksBookmarkId?: string       // TMarks 服务器书签ID
  
  // 快捷方式数据
  shortcut?: {
    url: string
    title: string
    favicon?: string
    faviconBase64?: string
  }
  
  // 书签文件夹数据
  bookmarkFolder?: {
    title: string
  }
  
  // 组件配置
  config?: WidgetConfig
  
  createdAt: number
}
```

#### ShortcutGroup（分组）
```typescript
interface ShortcutGroup {
  id: string                      // 分组ID
  name: string                    // 分组名称
  icon: string                    // Lucide 图标名称
  position: number                // 排序位置
  bookmarkFolderId?: string       // 对应的浏览器书签文件夹ID
}
```

#### NewTabSettings（设置）
```typescript
interface NewTabSettings {
  // 时钟
  showClock: boolean
  clockFormat: '12h' | '24h'
  showDate: boolean
  showSeconds: boolean
  
  // 搜索
  showSearch: boolean
  searchEngine: SearchEngine
  
  // 快捷方式
  showShortcuts: boolean
  shortcutColumns: 6 | 8 | 10
  shortcutStyle: 'icon' | 'card'
  
  // 壁纸
  wallpaper: WallpaperConfig
  
  // TMarks 同步
  showPinnedBookmarks: boolean
  enableSearchSuggestions: boolean
  
  // 其他
  showGreeting: boolean
  userName: string
  showLunar: boolean
  showPoetry: boolean
}
```

### 3.2 存储位置

#### 本地存储（chrome.storage.local）
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

#### 浏览器书签（chrome.bookmarks）
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

#### TMarks 服务器（D1 数据库）
- `newtab_groups_v2`：分组信息
- `newtab_shortcuts_v2`：快捷方式信息
- `newtab_grid_items`：网格项信息
- `newtab_operations`：操作日志（增量同步）
- `newtab_sync_state`：同步状态

---

## 四、核心功能模块

### 4.1 浏览器书签同步（browser-sync）

#### 功能
- 自动发现书签栏根文件夹
- 创建 TMarks 根文件夹
- 监听书签变更（创建、更新、删除、移动）
- 双向同步：本地 ↔ 浏览器书签

#### 核心文件
- `api.ts`：Chrome Bookmarks API 封装
- `root-folder.ts`：根文件夹管理
- `home-folder.ts`：Home 文件夹管理
- `listeners.ts`：书签变更监听
- `transform.ts`：数据转换（GridItem ↔ BookmarkTreeNode）
- `write-lock.ts`：写锁机制（避免循环同步）

#### 同步流程
```
用户操作 → 更新本地 GridItem → 镜像到浏览器书签 → Chrome Sync
                                                          ↓
其他设备 ← 监听书签变更 ← 浏览器书签同步 ← Chrome Sync
```

### 4.2 TMarks 服务器同步

#### 功能
- 防抖同步（2秒后执行）
- 只同步核心数据（标题、URL、分组、位置）
- 不同步图标、设置、文件夹

#### 同步时机
- 创建/更新/删除快捷方式
- 创建/更新/删除分组
- 移动快捷方式

#### 同步内容
```typescript
{
  groups: [
    { id, name, position }
  ],
  shortcuts: [
    { id, title, url, group_id, position }
  ]
}
```

### 4.3 网格布局系统（WidgetGrid）

#### 功能
- 响应式网格布局（6/8/10 列）
- 拖拽排序
- 多种尺寸支持（1x1/2x1/1x2/2x2等）
- 批量编辑模式
- 文件夹嵌套

#### 支持的组件类型
- `shortcut`：快捷方式
- `bookmarkFolder`：书签文件夹
- `weather`：天气组件
- `clock`：时钟组件
- `todo`：待办事项
- `notes`：备忘录
- `hotsearch`：热搜榜
- `poetry`：每日诗词

### 4.4 分组系统（GroupSidebar）

#### 功能
- 左侧侧边栏显示分组
- 滚轮切换分组（左右30%区域）
- 每个分组对应一个浏览器书签文件夹
- 支持自定义图标和名称

#### 默认分组
- `home`：首页（对应 TMarks 根文件夹）

### 4.5 搜索功能（SearchBar）

#### 功能
- 多搜索引擎支持（Google、Bing、百度等）
- 搜索建议（可选）
- 快捷键支持

### 4.6 壁纸系统（Wallpaper）

#### 支持的壁纸类型
- `color`：纯色背景
- `image`：自定义图片
- `bing`：Bing 每日壁纸
- `unsplash`：Unsplash 随机图片

#### 配置选项
- 模糊度（blur）
- 亮度（brightness）
- Bing 历史图片索引（0-7）

---

## 五、状态管理（Zustand Store）

### 5.1 Store 结构

```typescript
interface NewTabState {
  // 数据
  shortcuts: Shortcut[]
  shortcutGroups: ShortcutGroup[]
  shortcutFolders: ShortcutFolder[]
  gridItems: GridItem[]
  activeGroupId: string | null
  settings: NewTabSettings
  
  // UI 状态
  isLoading: boolean
  currentFolderId: string | null
  
  // 浏览器书签状态
  browserBookmarksRootId: string | null
  homeBrowserFolderId: string | null
  isApplyingBrowserBookmarks: boolean
  browserBookmarkWriteLockUntil: number
  
  // Actions（模块化）
  loadData: () => Promise<void>
  saveData: () => Promise<void>
  updateSettings: (updates: Partial<NewTabSettings>) => void
  
  // 快捷方式 Actions
  addShortcut: (data: ShortcutData) => void
  updateShortcut: (id: string, updates: Partial<ShortcutData>) => void
  deleteShortcut: (id: string) => void
  
  // 分组 Actions
  addGroup: (name: string, icon: string) => void
  updateGroup: (id: string, updates: Partial<ShortcutGroup>) => void
  deleteGroup: (id: string) => void
  setActiveGroup: (id: string) => void
  
  // 网格项 Actions
  addGridItem: (type: GridItemType, data: any) => void
  updateGridItem: (id: string, updates: any) => void
  deleteGridItem: (id: string) => void
  moveGridItem: (id: string, newPosition: number) => void
  
  // 浏览器书签 Actions
  applyBrowserBookmarks: () => Promise<void>
  syncBrowserBookmark: (gridItemId: string) => Promise<void>
  
  // 导航 Actions
  navigateToFolder: (folderId: string | null) => void
  navigateBack: () => void
}
```

### 5.2 模块化 Actions

为了代码可维护性，Actions 被拆分到多个文件：
- `actions/shortcuts.ts`：快捷方式操作
- `actions/groups.ts`：分组操作
- `actions/folders.ts`：文件夹操作
- `actions/grid-items.ts`：网格项操作
- `actions/browser-bookmarks.ts`：浏览器书签操作
- `actions/navigation.ts`：导航操作

---

## 六、数据流

### 6.1 用户创建快捷方式

```
用户点击"添加" 
  ↓
AddShortcutModal 输入 URL 和标题
  ↓
调用 addGridItem('shortcut', data)
  ↓
创建 GridItem 对象
  ↓
添加到 gridItems 数组
  ↓
保存到 chrome.storage.local
  ↓
镜像到浏览器书签（chrome.bookmarks.create）
  ↓
防抖同步到 TMarks 服务器（2秒后）
```

### 6.2 浏览器书签变更

```
用户在书签管理器中操作
  ↓
chrome.bookmarks.onCreated 触发
  ↓
listeners.ts 监听到变更
  ↓
检查是否在写锁期间（避免循环）
  ↓
转换为 GridItem
  ↓
添加到 gridItems 数组
  ↓
保存到 chrome.storage.local
  ↓
防抖同步到 TMarks 服务器
```

### 6.3 多设备同步

```
设备 A：创建快捷方式
  ↓
同步到浏览器书签
  ↓
Chrome Sync 同步到云端
  ↓
设备 B：浏览器书签同步
  ↓
监听到书签变更
  ↓
更新本地 GridItem
  ↓
UI 自动刷新
```

---

## 七、增量同步设计（新版）

### 7.1 核心思想
- **离线优先**：所有操作先在本地完成
- **操作日志**：记录每个操作（增删改）
- **增量同步**：只同步变更部分
- **冲突解决**：基于时间戳和版本号

### 7.2 数据结构

#### 操作日志
```typescript
interface Operation {
  id: string                      // 操作ID
  type: 'create' | 'update' | 'delete'
  target: 'shortcut' | 'group' | 'gridItem'
  targetId: string                // 目标对象ID
  timestamp: number               // 操作时间戳
  deviceId: string                // 操作设备
  data?: any                      // 操作数据
  synced: boolean                 // 是否已同步
}
```

#### 同步元数据
```typescript
interface SyncMeta {
  created_at: number              // 创建时间
  updated_at: number              // 最后更新时间
  deleted_at?: number             // 删除时间（软删除）
  device_id: string               // 最后修改设备
  version: number                 // 版本号
}
```

### 7.3 同步流程

#### Push（推送）
```
1. 获取未同步的操作（synced: false）
2. 批量推送到服务器
3. 服务器记录操作日志
4. 服务器应用操作到数据表
5. 标记操作为已同步
6. 更新同步时间
```

#### Pull（拉取）
```
1. 请求自上次同步后的操作
2. 排除当前设备的操作
3. 应用远程操作到本地
4. 冲突检测和解决
5. 更新同步时间
```

### 7.4 冲突解决策略

1. **删除优先**：任一设备删除，则删除
2. **最后写入胜出**：比较 `updated_at` 时间戳
3. **版本号比较**：时间戳相同时比较 `version`
4. **设备ID比较**：版本号也相同时比较 `device_id`（字典序）

---

## 八、待优化点

### 8.1 当前问题
1. **数据一致性**：本地、浏览器、服务器三处数据可能不一致
2. **图标存储**：图标只存储在本地，不同步
3. **文件夹同步**：服务器不同步文件夹结构
4. **冲突处理**：多设备同时修改时可能冲突

### 8.2 改进方向
1. **实现增量同步**：使用操作日志记录变更
2. **图标云存储**：将图标上传到服务器或 CDN
3. **完整数据同步**：同步文件夹结构和组件配置
4. **离线队列**：离线时缓存操作，联网后批量同步
5. **同步状态显示**：UI 显示同步状态和待同步数量

---

## 九、技术亮点

### 9.1 性能优化
- **防抖同步**：避免频繁请求
- **写锁机制**：避免循环同步
- **虚拟滚动**：大量书签时性能优化
- **图标缓存**：base64 缓存到本地

### 9.2 用户体验
- **滚轮切换分组**：左右30%区域滚轮切换分组
- **长按编辑**：长按2秒进入编辑模式
- **右键菜单**：快速添加快捷方式和文件夹
- **批量编辑**：支持批量移动和删除
- **拖拽排序**：直观的拖拽操作

### 9.3 扩展性
- **模块化 Actions**：易于维护和扩展
- **组件化设计**：可复用的 UI 组件
- **类型安全**：完整的 TypeScript 类型定义
- **插件化组件**：支持多种小组件类型

---

## 十、设置系统详解

### 10.1 设置面板结构

**4个标签页**：
1. **常规（General）** - 基础功能设置
2. **外观（Appearance）** - 视觉和布局设置
3. **同步（Sync）** - TMarks 同步设置
4. **AI（AI）** - AI 智能整理设置

### 10.2 常规设置（GeneralTab）

#### 语言设置
- 支持多语言切换
- 切换后自动刷新页面
- 支持的语言：中文、英文、日文等

#### 个性化
```typescript
{
  showGreeting: boolean        // 显示问候语
  userName: string             // 用户名称
}
```

#### 时钟设置
```typescript
{
  showClock: boolean           // 显示时钟
  showDate: boolean            // 显示日期
  showSeconds: boolean         // 显示秒数
  showLunar: boolean           // 显示农历
  clockFormat: '12h' | '24h'   // 时间格式
}
```

#### 诗词设置
```typescript
{
  showPoetry: boolean          // 显示每日诗词
}
```

#### 搜索设置
```typescript
{
  showSearch: boolean          // 显示搜索框
  searchEngine: SearchEngine   // 搜索引擎（Google/Bing/百度等）
}
```

#### 离线缓存
- 缓存所有快捷方式图标到本地（base64）
- 离线时可正常显示图标

### 10.3 外观设置（AppearanceTab）

#### 快捷方式设置
```typescript
{
  showShortcuts: boolean                // 显示快捷方式
  shortcutColumns: 6 | 8 | 10          // 每行显示数量
  shortcutStyle: 'icon' | 'card'       // 显示样式
}
```

#### 壁纸设置
```typescript
{
  wallpaper: {
    type: WallpaperType                // 壁纸类型
    value: string                      // 颜色值或图片URL
    blur: number                       // 模糊度（0-20）
    brightness: number                 // 亮度（20-100）
    bingHistoryIndex?: number          // Bing历史图片索引（0-7）
    showBingInfo?: boolean             // 显示Bing图片信息
  }
}
```

**壁纸类型**：
- `color`：纯色背景
- `bing`：Bing 每日壁纸（支持历史8天）
- `unsplash`：Unsplash 随机图片
- `image`：自定义图片URL

### 10.4 同步设置（SyncTab）

#### TMarks 同步
```typescript
{
  showPinnedBookmarks: boolean         // 显示置顶书签（Dock栏）
  enableSearchSuggestions: boolean     // 启用搜索建议
}
```

#### 自动刷新
```typescript
{
  autoRefreshPinnedBookmarks: boolean  // 自动刷新置顶书签
  pinnedBookmarksRefreshTime: 'morning' | 'evening'  // 刷新时间
}
```

**刷新时间**：
- `morning`：早上8点
- `evening`：晚上22点

### 10.5 AI 设置（AITab）

#### AI 智能整理开关
```typescript
{
  enableWorkspaceAiOrganize: boolean   // 启用AI整理
}
```

#### 自定义规则
```typescript
{
  workspaceAiOrganizeRules: string     // 自定义整理规则（多行文本）
}
```

**示例规则**：
```
- 将所有 github.com 域名放入"开发"文件夹
- 将所有 figma.com 域名放入"设计"文件夹
- 将所有购物网站放入"购物"文件夹
```

#### 自定义提示词
```typescript
{
  enableWorkspaceAiOrganizeCustomPrompt: boolean  // 启用自定义提示词
  workspaceAiOrganizePrompt: string               // 自定义提示词模板
}
```

**功能**：
- 支持自定义 AI 提示词模板
- 可使用变量：`{{rules}}`、`{{domainSummariesJson}}`、`{{topLevelCount}}`等
- 提供"使用默认模板"按钮快速恢复

#### 限制设置
```typescript
{
  workspaceAiOrganizeMaxBookmarks: number      // 域名数量限制（50-2000）
  workspaceAiOrganizeTopLevelCount: number     // 一级文件夹数量（2-7）
}
```

**说明**：
- 域名数量限制：防止处理过多书签导致超时
- 一级文件夹数量：控制文件夹结构的复杂度

#### 历史热度
```typescript
{
  enableHistoryHeat: boolean           // 启用历史热度分析
  historyDays: number                  // 统计天数（1-90）
  historyHeatTopN: number              // Top N 高频域名（5-100）
}
```

**功能**：
- 分析用户浏览历史
- 识别高频访问的域名
- 优先整理到一级文件夹

#### 层级策略
```typescript
{
  workspaceAiOrganizeStrictHierarchy: boolean      // 严格层级（禁止新建一级文件夹）
  workspaceAiOrganizeAllowNewFolders: boolean      // 允许新建文件夹
  workspaceAiOrganizePreferOriginalPaths: boolean  // 优先保留原路径
  workspaceAiOrganizeVerboseLogs: boolean          // 详细日志
}
```

**策略说明**：
- **严格层级**：只使用现有一级文件夹，不创建新的
- **允许新建文件夹**：AI 可以创建新的二级文件夹
- **优先保留原路径**：尽量保持书签原有的文件夹位置
- **详细日志**：在控制台显示详细的整理过程

#### AI 整理控制台
**功能**：
- 实时显示 AI 整理进度
- 显示日志级别（info/warn/error/success）
- 支持自动滚动
- 支持清空日志
- 支持复制日志到剪贴板

**日志格式**：
```
[时间] [级别] [步骤] 消息
详细信息（JSON）
```

### 10.6 设置数据存储

#### 存储位置
```typescript
chrome.storage.local['newtab'].settings
```

#### 默认值（DEFAULT_SETTINGS）
```typescript
{
  // 时钟
  showClock: true,
  clockFormat: '24h',
  showDate: true,
  showSeconds: false,
  
  // 搜索
  showSearch: true,
  searchEngine: 'google',
  
  // 快捷方式
  showShortcuts: true,
  shortcutColumns: 8,
  shortcutStyle: 'icon',
  
  // 壁纸
  wallpaper: {
    type: 'bing',
    value: '',
    blur: 0,
    brightness: 100,
    bingHistoryIndex: 0,
    showBingInfo: false
  },
  
  // TMarks 同步
  showPinnedBookmarks: true,
  enableSearchSuggestions: true,
  autoRefreshPinnedBookmarks: true,
  pinnedBookmarksRefreshTime: 'morning',
  
  // 个性化
  showGreeting: true,
  userName: '',
  showLunar: true,
  showPoetry: true,
  
  // AI 整理
  enableWorkspaceAiOrganize: true,
  workspaceAiOrganizeRules: '',
  workspaceAiOrganizeMaxBookmarks: 300,
  enableHistoryHeat: false,
  historyDays: 30,
  historyHeatTopN: 20,
  workspaceAiOrganizeStrictHierarchy: false,
  workspaceAiOrganizeAllowNewFolders: true,
  workspaceAiOrganizePreferOriginalPaths: true,
  workspaceAiOrganizeVerboseLogs: true,
  workspaceAiOrganizeTopLevelCount: 5,
  enableWorkspaceAiOrganizeCustomPrompt: false,
  workspaceAiOrganizePrompt: ''
}
```

### 10.7 设置更新流程

```
用户修改设置
  ↓
updateSettings(updates)
  ↓
合并到 settings 对象
  ↓
保存到 chrome.storage.local
  ↓
防抖同步到 TMarks 服务器（2秒后）
  ↓
UI 自动刷新
```

### 10.8 设置组件架构

```
SettingsPanel（主面板）
├── 左侧标签栏
│   ├── 常规（User 图标）
│   ├── 外观（Palette 图标）
│   ├── 同步（Cloud 图标）
│   └── AI（Sparkles 图标）
└── 右侧内容区
    ├── GeneralTab
    │   ├── SettingSection（语言）
    │   ├── SettingSection（个性化）
    │   ├── SettingSection（时钟）
    │   ├── SettingSection（诗词）
    │   ├── SettingSection（搜索）
    │   └── SettingSection（离线缓存）
    ├── AppearanceTab
    │   ├── SettingSection（快捷方式）
    │   └── SettingSection（壁纸）
    ├── SyncTab
    │   ├── SettingSection（TMarks同步）
    │   └── SettingSection（自动刷新）
    └── AITab
        ├── SettingSection（AI整理）
        │   ├── CustomRulesSection
        │   ├── CustomPromptSection
        │   ├── LimitsSection
        │   ├── HistoryHeatSection
        │   └── HierarchyStrategySection
        └── AIOrganizeConsole（控制台弹窗）
```

### 10.9 设置项组件（SettingItems）

**通用组件**：
- `SettingSection`：设置区块容器
- `ToggleItem`：开关项
- `TextItem`：文本输入项
- `SelectItem`：下拉选择项
- `ColorItem`：颜色选择项
- `RangeItem`：滑块项
- `CacheFaviconsButton`：缓存图标按钮

**使用示例**：
```typescript
<SettingSection title="时钟">
  <ToggleItem
    label="显示时钟"
    checked={settings.showClock}
    onChange={(v) => updateSettings({ showClock: v })}
  />
  <SelectItem
    label="时间格式"
    value={settings.clockFormat}
    options={[
      { value: '24h', label: '24小时制' },
      { value: '12h', label: '12小时制' }
    ]}
    onChange={(v) => updateSettings({ clockFormat: v })}
  />
</SettingSection>
```

---

## 十一、Background 消息处理架构

### 11.1 消息处理流程

```
Popup/Content Script/NewTab
  ↓
chrome.runtime.sendMessage({ type, payload })
  ↓
Background Service Worker (index.ts)
  ↓
handleMessage() 路由分发
  ↓
具体 Handler 处理
  ↓
返回 MessageResponse
```

### 11.2 消息类型（MessageType）

#### 页面信息提取
- `EXTRACT_PAGE_INFO`：提取当前页面信息（标题、URL、描述、缩略图等）
- `PING`：检测 Content Script 是否存活

#### AI 推荐
- `RECOMMEND_TAGS`：推荐标签（TMarks 书签功能）
- `RECOMMEND_NEWTAB_FOLDER`：推荐 NewTab 文件夹

#### NewTab 操作
- `SAVE_TO_NEWTAB`：保存书签到 NewTab
- `IMPORT_ALL_BOOKMARKS_TO_NEWTAB`：导入所有书签到 NewTab
- `GET_NEWTAB_FOLDERS`：获取 NewTab 文件夹列表
- `REFRESH_PINNED_BOOKMARKS`：刷新置顶书签

#### TMarks 书签操作
- `SAVE_BOOKMARK`：保存书签到 TMarks
- `GET_EXISTING_TAGS`：获取已有标签
- `UPDATE_BOOKMARK_TAGS`：更新书签标签
- `UPDATE_BOOKMARK_DESCRIPTION`：更新书签描述
- `CREATE_SNAPSHOT`：创建页面快照

#### 同步操作
- `SYNC_CACHE`：同步缓存

#### 配置操作
- `GET_CONFIG`：获取配置

### 11.3 Handler 模块

#### page-info.ts（页面信息提取）

**功能**：
- 提取当前标签页的页面信息
- 自动注入 Content Script（如果未加载）
- 超时保护（3秒检测，5秒提取）
- Fallback 机制（提取失败时返回基本信息）

**流程**：
```
1. 获取当前活动标签页
2. 检查是否为特殊页面（chrome://、edge:// 等）
3. 发送 PING 检测 Content Script 是否存活
4. 如果不存活，尝试注入 Content Script
5. 发送 EXTRACT_PAGE_INFO 请求
6. 超时或失败时返回基本信息（标题 + URL）
```

**返回数据**：
```typescript
{
  title: string
  url: string
  description: string
  content: string
  thumbnail: string
  thumbnails?: string[]
  favicon?: string
}
```

#### newtab-folders.ts（NewTab 文件夹操作）

**功能**：
- 保存书签到 NewTab
- 导入所有书签到 NewTab
- 获取 NewTab 文件夹树

**handleSaveToNewtab**：
```typescript
输入：{ url, title?, parentBookmarkId? }
流程：
  1. 确保 NewTab 根文件夹存在
  2. 使用 chrome.bookmarks.create 创建书签
  3. 返回创建的书签 ID
输出：{ id: string }
```

**handleImportAllBookmarksToNewtab**：
```typescript
流程：
  1. 确保 NewTab 根文件夹存在
  2. 创建"导入 YYYY-MM-DD HH:mm"文件夹
  3. 遍历所有书签栏书签（排除 NewTab 根文件夹）
  4. 递归复制书签和文件夹
  5. 返回导入统计信息
输出：{
  importFolderId: string
  folderTitle: string
  counts: { folders: number, bookmarks: number }
}
```

**handleGetNewtabFolders**：
```typescript
流程：
  1. 确保 NewTab 根文件夹存在
  2. 广度优先遍历文件夹树（最多 200 个）
  3. 构建文件夹路径（如 "TMarks/工作/项目A"）
输出：{
  rootId: string
  folders: Array<{
    id: string
    title: string
    parentId: string | null
    path: string
  }>
}
```

#### ai-recommend.ts（AI 推荐）

**功能**：
- 推荐 NewTab 文件夹（保存书签时）

**handleRecommendNewtabFolder**：
```typescript
输入：{ title, url, description }
流程：
  1. 检查是否启用 AI 推荐（enableNewtabAI）
  2. 获取推荐数量（newtabFolderRecommendCount，默认 10）
  3. 获取所有 NewTab 文件夹路径
  4. 构建 AI 提示词（支持自定义模板）
  5. 调用 AI API
  6. 解析 AI 返回的 JSON
  7. 匹配文件夹路径到 ID
  8. 返回推荐列表（按置信度排序）
输出：{
  suggestedFolders: Array<{
    id: string
    path: string
    confidence: number
  }>
}
```

**AI 提示词模板变量**：
- `{{title}}`：页面标题
- `{{url}}`：页面 URL
- `{{description}}`：页面描述
- `{{recommendCount}}`：推荐数量
- `{{folderPaths}}`：文件夹路径列表（换行分隔）

**AI 返回格式**：
```json
{
  "suggestedFolders": [
    { "path": "TMarks/工作/项目A", "confidence": 0.95 },
    { "path": "TMarks/开发/前端", "confidence": 0.85 }
  ]
}
```

### 11.4 Service 模块

#### newtab-folder.ts（NewTab 文件夹管理）

**核心函数**：

**ensureNewtabRootFolder()**：
```typescript
功能：确保 NewTab 根文件夹存在
流程：
  1. 从 chrome.storage.local 读取缓存的 rootId
  2. 验证 rootId 是否有效
  3. 如果无效，搜索书签栏中的 "TMarks" 文件夹
  4. 如果不存在，创建新的 "TMarks" 文件夹
  5. 缓存 rootId 到 chrome.storage.local
返回：{ id: string, title: string } | null
```

**ensureNewtabWorkspaceFolders()**：
```typescript
功能：确保 NewTab 工作区文件夹存在
流程：
  1. 确保根文件夹存在
  2. 检查是否已有子文件夹
  3. 如果没有，创建默认文件夹（工作、学习、生活等）
```

**handleBookmarkNodeRemoved(id)**：
```typescript
功能：处理书签删除事件
流程：
  1. 检查删除的是否为 NewTab 根文件夹
  2. 如果是，清除缓存的 rootId
  3. 下次访问时会重新创建
```

**handleBookmarkNodeMoved(id)**：
```typescript
功能：处理书签移动事件
流程：
  1. 检查移动的是否为 NewTab 根文件夹
  2. 如果是，更新缓存的 rootId
```

#### bookmark-collector.ts（书签收集器）

**importAllBookmarksToNewtab(newtabRootId)**：
```typescript
功能：导入所有书签到 NewTab
流程：
  1. 获取书签栏根节点
  2. 创建"导入 YYYY-MM-DD HH:mm"文件夹
  3. 递归遍历书签树
  4. 排除 NewTab 根文件夹本身
  5. 复制书签和文件夹到导入文件夹
  6. 统计导入数量
返回：{
  importFolderId: string
  folderTitle: string
  counts: { folders: number, bookmarks: number }
}
```

### 11.5 定时任务

#### 自动同步缓存
```typescript
时间：每天 23:00
条件：preferences.autoSync === true
功能：调用 cacheManager.autoSync()
```

#### 刷新置顶书签
```typescript
时间：早上 8:00 或 晚上 22:00（可配置）
条件：settings.autoRefreshPinnedBookmarks === true
功能：
  1. 清除置顶书签缓存
  2. 向所有 NewTab 页面发送刷新消息
  3. NewTab 页面重新加载置顶书签
```

### 11.6 生命周期事件

#### onInstalled
```typescript
触发时机：扩展安装或更新
操作：
  - 确保 NewTab 工作区文件夹存在
  - 预加载 AI 上下文
```

#### onStartup
```typescript
触发时机：浏览器启动
操作：
  - 确保 NewTab 工作区文件夹存在
  - 同步待处理的书签
  - 同步待处理的标签组
  - 启动定时任务
```

#### bookmarks.onRemoved
```typescript
触发时机：书签被删除
操作：
  - 检查是否为 NewTab 根文件夹
  - 清除缓存
```

#### bookmarks.onMoved
```typescript
触发时机：书签被移动
操作：
  - 检查是否为 NewTab 根文件夹
  - 更新缓存
```

### 11.7 错误处理

**统一错误处理**：
```typescript
try {
  const response = await handleMessage(message, sender);
  sendResponse(response);
} catch (error) {
  sendResponse({
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error'
  });
}
```

**超时保护**：
```typescript
async function sendMessageWithTimeout(
  tabId: number,
  msg: Message,
  timeoutMs: number = 3000
): Promise<MessageResponse> {
  return Promise.race([
    chrome.tabs.sendMessage(tabId, msg),
    new Promise<MessageResponse>((_, reject) =>
      setTimeout(() => reject(new Error('Message timeout')), timeoutMs)
    )
  ]);
}
```

**Fallback 机制**：
- Content Script 注入失败 → 返回基本页面信息
- AI 推荐失败 → 返回空列表
- 文件夹不存在 → 自动创建

### 11.8 日志记录

**关键日志点**：
```typescript
// Service Worker 启动
console.log('[BG] init', {
  runtimeId: chrome.runtime.id,
  loadedAt: new Date().toISOString()
});

// 消息接收
console.log('[BG] onMessage', {
  runtimeId: chrome.runtime.id,
  senderId: sender?.id,
  senderUrl: sender?.url,
  rawType: message?.type
});

// 定时任务
console.log('[Background] 开始刷新置顶书签缓存');
console.log('[Background] 下次置顶书签刷新时间: ...');
```

---

## 十二、总结

NewTab 是一个功能丰富的浏览器新标签页扩展，核心特点：

1. **三层存储**：本地存储 + 浏览器书签 + 服务器同步
2. **双向同步**：本地 ↔ 浏览器书签自动同步
3. **网格布局**：灵活的网格系统，支持多种组件
4. **分组管理**：左侧侧边栏分组，每个分组对应一个书签文件夹
5. **多设备同步**：通过 Chrome Sync 和 TMarks 服务器实现跨设备同步
6. **消息驱动**：Background Service Worker 处理所有跨页面通信
7. **AI 增强**：智能推荐文件夹、标签和整理书签

下一步重点：
- 实现增量同步（操作日志）
- 完善冲突解决机制
- 优化离线体验
- 增加同步状态显示
