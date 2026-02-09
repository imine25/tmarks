# NewTab AI 智能整理详解

## 概述

NewTab AI 智能整理是浏览器扩展端最强大的功能之一，可以自动分析所有书签，按照语义、使用频率和用户规则重新组织文件夹结构。

### 核心特点

- **域名级别整理** - 按域名聚合，而非单个书签
- **热度驱动** - 结合书签数量、点击次数、历史访问频率
- **智能分类** - AI 语义分析 + 用户自定义规则
- **层级控制** - 最多 2 层文件夹，避免过度嵌套
- **实时监控** - 完整的日志控制台，可视化整理过程

## 使用场景

1. **书签杂乱无章** - 长期积累的书签需要重新分类
2. **高频网站优先** - 希望常用网站放在一级目录
3. **相似域名合并** - 同产品的多个子域名需要聚合
4. **定期维护** - 定期整理书签结构，保持清晰

## 完整流程

```
1. 数据收集阶段
   ├─ 收集所有浏览器书签（排除 TMarks 文件夹）
   ├─ 按域名聚合统计
   ├─ 加载 NewTab 快捷方式使用数据
   └─ [可选] 读取浏览器历史记录（最近 N 天）
   ↓
2. 数据分析阶段
   ├─ 计算域名访问频率（快捷方式点击 + 历史访问）
   ├─ 计算最近访问时间（时间衰减）
   ├─ 生成热度评分（综合评分算法）
   └─ 提取原始路径分布（Top 5 路径）
   ↓
3. 生成域名摘要
   ├─ 域名基本信息（域名、书签数量）
   ├─ 使用统计（快捷方式数、点击次数、历史访问次数）
   ├─ 热度评分（heatScore、recencyScore）
   ├─ 原始路径分布（按书签数量排序）
   └─ 示例书签（前 3 个）
   ↓
4. AI 分析阶段
   ├─ 构建 AI Prompt
   │  - 用户自定义规则（最高优先级）
   │  - Top N 高频域名列表
   │  - 所有域名摘要（分批）
   │  - 现有文件夹路径
   │  - 配置开关（层级控制、新建限制）
   ├─ 调用 AI API
   └─ 解析 AI 响应（domainMoves + fallbackPath）
   ↓
5. 执行整理阶段
   ├─ 清空 TMarks 工作区（保留 NewTab Home）
   ├─ 创建文件夹结构（按 AI 规划）
   ├─ 复制书签到目标文件夹
   └─ 实时报告进度
   ↓
6. 完成
   ├─ 显示统计信息（创建文件夹数、复制书签数）
   └─ 保存日志（可复制）
```


## 数据收集

### 域名摘要结构

```typescript
interface DomainSummary {
  // 基本信息
  domain: string              // 域名（如 github.com）
  count: number               // 书签数量
  bookmarkCount: number       // 书签数量（同 count）
  
  // 使用统计
  shortcutCount: number       // NewTab 快捷方式数量
  clickCount: number          // 快捷方式总点击次数
  historyCount: number        // 历史访问次数（最近 N 天）
  historyLastVisit: number    // 最后访问时间戳
  historyLastVisitISO: string // 最后访问时间 ISO 格式
  
  // 热度评分
  recencyScore: number        // 最近访问评分 (0-1)
  heatScore: number           // 综合热度评分
  
  // 路径分布
  originalPaths: Array<{      // 原始路径分布（Top 5）
    path: string              // 文件夹路径
    count: number             // 该路径下的书签数量
  }>
  
  // 示例书签
  samples: Array<{            // 示例书签（前 3 个）
    title: string
    url: string
    path: string
  }>
}
```

### 收集流程详解

#### 1. 收集浏览器书签

**API 调用**：`chrome.bookmarks.getTree()`

**遍历策略**：
- 使用栈（Stack）进行深度优先遍历
- 跳过 TMarks 根文件夹（避免重复）
- 记录每个书签的完整路径

**提取信息**：
- 书签 ID、标题、URL
- 从 URL 提取域名（使用 `getHostname` 工具函数）
- 文件夹路径（用 `/` 分隔）

**示例**：
```typescript
// 书签：https://github.com/facebook/react
// 路径：开发/前端/React
{
  id: "123",
  title: "React - A JavaScript library",
  url: "https://github.com/facebook/react",
  domain: "github.com",
  path: "开发/前端/React"
}
```

#### 2. 按域名聚合

**聚合逻辑**：
- 使用 Map 存储：`Map<domain, BookmarkItem[]>`
- 相同域名的书签归为一组
- 统计每个域名的书签数量

**路径分布统计**：
- 统计每个域名在不同路径下的书签数量
- 按数量降序排序
- 保留 Top 5 路径

**示例**：
```typescript
// github.com 的路径分布
originalPaths: [
  { path: "开发/代码托管", count: 15 },
  { path: "开发/前端", count: 8 },
  { path: "开发/后端", count: 5 },
  { path: "学习/教程", count: 3 },
  { path: "工具", count: 2 }
]
```

#### 3. 加载使用统计

**数据来源**：NewTab 快捷方式（存储在 `chrome.storage.local`）

**统计内容**：
- 每个域名的快捷方式数量
- 每个域名的总点击次数

**聚合函数**：`aggregateShortcutStats(shortcuts)`

**示例**：
```typescript
// github.com 的使用统计
{
  shortcutCount: 3,    // 3 个快捷方式
  clickCount: 127      // 总共点击 127 次
}
```

#### 4. 读取历史记录（可选）

**API 调用**：`chrome.history.search()`

**查询参数**：
- `text: ''` - 查询所有记录
- `startTime: Date.now() - days * 24 * 60 * 60 * 1000` - 起始时间
- `maxResults: 5000` - 最大结果数

**统计内容**：
- 每个域名的访问次数
- 每个域名的最后访问时间

**注意事项**：
- 历史记录 API 可能不可用（隐私模式）
- 结果可能被截断（超过 5000 条）
- 需要用户授权历史记录权限

**示例**：
```typescript
// github.com 的历史统计（最近 30 天）
{
  count: 245,                    // 访问 245 次
  lastVisitTime: 1707234567890   // 最后访问时间戳
}
```


## 热度计算

### 评分算法

```typescript
热度评分 = 书签数量 × 1.0
         + 点击次数 × 0.5
         + 历史访问次数 × 0.3
         + 最近访问评分 × 2.0

最近访问评分 = max(0, min(1, 1 - (当前时间 - 最后访问时间) / 分析天数))
```

### 评分组成

#### 1. 书签数量（权重 1.0）

- 直接反映用户对该域名的重视程度
- 书签越多，说明该域名内容越丰富

#### 2. 点击次数（权重 0.5）

- 来自 NewTab 快捷方式的点击统计
- 反映用户的实际使用频率
- 权重较低，避免过度依赖点击数据

#### 3. 历史访问次数（权重 0.3）

- 来自浏览器历史记录
- 反映用户的浏览习惯
- 权重最低，作为辅助参考

#### 4. 最近访问评分（权重 2.0）

- 时间衰减算法，越近访问评分越高
- 权重最高，确保最近使用的网站优先
- 评分范围 0-1

**时间衰减示例**（分析天数 30 天）：
- 今天访问：评分 1.0
- 15 天前访问：评分 0.5
- 30 天前访问：评分 0.0
- 超过 30 天：评分 0.0

### 评分范围

- **最低**：0 分（无任何数据）
- **最高**：无上限（取决于使用频率）
- **典型范围**：0-100 分

### 排序规则

1. 按热度评分降序排序
2. 热度相同时按书签数量降序排序

### 评分示例

#### 示例 1：高频开发网站

```typescript
// github.com
{
  bookmarkCount: 50,        // 50 个书签
  clickCount: 200,          // 200 次点击
  historyCount: 500,        // 500 次访问
  recencyScore: 0.95,       // 最近访问
  
  heatScore: 50 × 1.0 + 200 × 0.5 + 500 × 0.3 + 0.95 × 2.0
           = 50 + 100 + 150 + 1.9
           = 301.9
}
```

#### 示例 2：偶尔使用的工具网站

```typescript
// figma.com
{
  bookmarkCount: 5,         // 5 个书签
  clickCount: 10,           // 10 次点击
  historyCount: 20,         // 20 次访问
  recencyScore: 0.3,        // 较久未访问
  
  heatScore: 5 × 1.0 + 10 × 0.5 + 20 × 0.3 + 0.3 × 2.0
           = 5 + 5 + 6 + 0.6
           = 16.6
}
```

#### 示例 3：新添加的书签

```typescript
// new-site.com
{
  bookmarkCount: 3,         // 3 个书签
  clickCount: 0,            // 无点击
  historyCount: 0,          // 无历史
  recencyScore: 0,          // 无访问
  
  heatScore: 3 × 1.0 + 0 × 0.5 + 0 × 0.3 + 0 × 2.0
           = 3
}
```

## AI Prompt 设计

### Prompt 模板结构

```
你是书签批量整理助手。使用聚类思想将域名分类到文件夹结构中。

## 输入数据
- 用户规则（最高优先级）: {{rules}}
- 域名数据 JSON: {{domainSummariesJson}}
- 目标一级目录数: {{topLevelCount}}

### 域名数据结构说明
- topHistoryDomains: Top {{topHistoryLimit}} 高频域名（必须放一级目录）
- batches[].domains: 所有待整理的域名列表
- folderPaths: 用户现有的文件夹路径

## 目录层级规则
只允许两种结构：
- 一级分类/书签（如：开发/github.com）
- 一级分类/二级分类/书签（如：开发/前端/react.dev）

禁止三层文件夹

## 整理方法

### 第一步：域名聚合
- 同一产品/服务的不同子域名 → 合并
- 功能相似的网站 → 合并

### 第二步：形成分类
- 聚合后的组形成一级或二级分类
- 一级目录数量控制在 {{topLevelCount}} 个左右
- 每个分类至少 3 个域名，否则合并到更大类别

## 核心规则

### 1. 优先使用现有文件夹
- topHistoryDomains 应放入最匹配的一级分类文件夹
- 非高频域名可以放入二级分类文件夹

### 2. 聚合原则
- 宁粗勿细，避免过度细分
- 少于 3 个域名的分类 → 合并到更大类别

### 3. 配置开关
- strictHierarchy=true: 禁止新建一级目录
- allowNewFolders=false: 禁止新建任何目录
- preferOriginalPaths=true: 优先保留原路径

## 输出格式（严格 JSON）
{
  "domainMoves": [
    {"domain": "github.com", "path": "开发"},
    {"domain": "react.dev", "path": "开发/前端"}
  ],
  "fallbackPath": "其他"
}
```

### 变量说明

#### {{rules}} - 用户自定义规则

**格式**：自由文本

**示例**：
```
GitHub 相关放到「开发/代码托管」
设计工具放到「设计」
新闻网站放到「资讯」
```

**优先级**：最高，AI 必须遵守

#### {{domainSummariesJson}} - 域名数据 JSON

**结构**：
```typescript
{
  totalDomains: number,           // 总域名数
  totalBatches: number,           // 总批次数
  batchSize: number,              // 批量大小（默认 300）
  topHistoryLimit: number,        // Top N 限制（默认 20）
  topHistoryDomains: DomainSummary[], // Top N 高频域名
  folderPaths: Array<{            // 现有文件夹路径
    path: string,
    count: number
  }>,
  strictHierarchy: boolean,       // 是否禁止新建一级目录
  allowNewFolders: boolean,       // 是否允许新建文件夹
  preferOriginalPaths: boolean,   // 是否优先保留原路径
  batches: Array<{                // 域名批次
    batchIndex: number,
    totalBatches: number,
    waitForMoreBatches: boolean,
    isFinalBatch: boolean,
    domains: DomainSummary[]
  }>
}
```

**批量处理**：
- 每批最多 300 个域名（可配置）
- 避免单次请求过大
- 当前实现：一次性发送所有批次

#### {{topLevelCount}} - 一级目录数量

**范围**：2-7（默认 5）

**作用**：
- 控制一级目录数量
- 如果 AI 返回超过限制，自动合并到 fallbackPath

#### {{topHistoryLimit}} - Top N 高频域名

**范围**：10-50（默认 20）

**作用**：
- 标记最常用的域名
- 这些域名必须放在一级目录


### 整理原则详解

#### 1. 聚合原则

**同产品不同子域名合并**

示例：
```
github.com
gist.github.com
docs.github.com
→ 合并到「开发/代码托管」
```

**功能相似的网站合并**

示例：
```
figma.com
sketch.com
canva.com
→ 合并到「设计」
```

**少于 3 个域名的分类合并**

示例：
```
分类「机器学习」只有 2 个域名
→ 合并到更大的「AI」分类
```

#### 2. 层级规则

**允许的结构**：
- ✅ 一级分类/书签：`开发/github.com`
- ✅ 一级/二级分类/书签：`开发/前端/react.dev`

**禁止的结构**：
- ❌ 三层嵌套：`开发/前端/框架/react.dev`
- ❌ 四层及以上

**原因**：
- 避免过度嵌套，难以查找
- 保持结构清晰简洁
- 符合大多数用户的使用习惯

#### 3. 优先级规则

**从高到低**：

1. **用户自定义规则**（最高优先级）
   - 用户明确指定的分类规则
   - AI 必须严格遵守
   - 示例："GitHub 相关放到「开发/代码托管」"

2. **历史访问热度**（Top N 放一级目录）
   - 最常访问的 N 个域名
   - 必须放在一级目录
   - 确保高频网站易于访问

3. **现有文件夹路径**（优先保留）
   - 参考用户现有的文件夹结构
   - 优先使用已有的文件夹名称
   - 保持用户习惯

4. **AI 语义分析**（最低优先级）
   - 根据域名和内容进行语义分析
   - 自动归类到合适的分类
   - 作为兜底策略

#### 4. 配置开关

**strictHierarchy（严格层级）**

- `true`：禁止新建一级目录
- `false`：允许新建一级目录（默认）

**使用场景**：
- 用户已有完善的一级分类
- 不希望 AI 创建新的一级目录
- 只允许在现有分类下创建二级目录

**allowNewFolders（允许新建文件夹）**

- `true`：允许新建文件夹（默认）
- `false`：禁止新建任何文件夹

**使用场景**：
- 用户只想重新分配书签到现有文件夹
- 不希望改变现有的文件夹结构
- 仅做书签位置调整

**preferOriginalPaths（优先保留原路径）**

- `true`：优先保留原路径（默认）
- `false`：完全按 AI 分析重新分类

**使用场景**：
- 用户希望保持大部分原有结构
- 只对少数书签进行调整
- 减少变动，降低适应成本

### 常见分类参考

AI Prompt 中提供的分类参考：

```
- 开发: github, stackoverflow, npm, docker, gitlab
- 设计: figma, dribbble, behance, canva
- 社交: twitter, facebook, weibo, zhihu, reddit
- 视频: youtube, bilibili, netflix, twitch
- 购物: amazon, taobao, jd, ebay
- 新闻: bbc, cnn, sina, hackernews
- 工具: notion, trello, google, dropbox
- 学习: coursera, udemy, mooc, leetcode
```

### AI 响应格式

**标准格式**：
```json
{
  "domainMoves": [
    {"domain": "github.com", "path": "开发"},
    {"domain": "stackoverflow.com", "path": "开发/问答"},
    {"domain": "react.dev", "path": "开发/前端"},
    {"domain": "figma.com", "path": "设计"},
    {"domain": "unknown-site.com", "path": "其他"}
  ],
  "fallbackPath": "其他/未分类"
}
```

**字段说明**：

- `domainMoves`：域名到路径的映射数组
  - `domain`：域名（必须与输入完全一致）
  - `path`：目标文件夹路径（1-2 层）

- `fallbackPath`：兜底路径
  - 用于无法分类的域名
  - 用于超出一级目录限制的域名

**响应解析**：
- 提取 JSON 内容（支持 Markdown 代码块）
- 验证所有输入域名都有对应的 path
- 验证 path 层级不超过 2 层
- 清理路径（去除空格、多余斜杠）


## 配置选项

### 历史热度分析

#### enableHistoryHeat（启用历史热度）

- **类型**：boolean
- **默认值**：false
- **说明**：是否启用浏览器历史记录分析

**启用后**：
- 读取最近 N 天的浏览历史
- 统计每个域名的访问次数
- 计算最近访问时间
- 纳入热度评分计算

**注意事项**：
- 需要用户授权历史记录权限
- 隐私模式下可能不可用
- 历史记录过多时可能被截断（最多 5000 条）

#### historyDays（分析天数）

- **类型**：number
- **范围**：7-90
- **默认值**：30
- **说明**：分析最近多少天的历史记录

**建议值**：
- 7 天：短期使用习惯
- 30 天：中期使用习惯（推荐）
- 90 天：长期使用习惯

#### historyHeatTopN（Top N 高频域名）

- **类型**：number
- **范围**：10-50
- **默认值**：20
- **说明**：Top N 高频域名必须放在一级目录

**作用**：
- 确保最常用的网站易于访问
- 这些域名不会被放到二级目录
- 优先级高于 AI 语义分析

### 层级控制

#### topLevelCount（一级目录数量）

- **类型**：number
- **范围**：2-7
- **默认值**：5
- **说明**：一级目录的数量限制

**限制机制**：
- AI 返回的一级目录超过限制时
- 统计每个一级目录的域名数量
- 保留域名数量最多的 N 个一级目录
- 其余一级目录下的域名合并到 fallbackPath

**示例**：
```
AI 返回 8 个一级目录，限制为 5 个

一级目录域名统计：
- 开发: 150 个域名 ✅ 保留
- 工具: 80 个域名 ✅ 保留
- 学习: 60 个域名 ✅ 保留
- 设计: 45 个域名 ✅ 保留
- 社交: 30 个域名 ✅ 保留
- 购物: 15 个域名 ❌ 合并到「其他」
- 视频: 10 个域名 ❌ 合并到「其他」
- 新闻: 8 个域名 ❌ 合并到「其他」
```

#### strictHierarchy（严格层级）

- **类型**：boolean
- **默认值**：false
- **说明**：是否禁止新建一级目录

**启用后**：
- AI 只能使用现有的一级目录
- 不能创建新的一级目录
- 可以在现有一级目录下创建二级目录
- `allowNewFolders` 自动设置为 false

**使用场景**：
- 用户已有完善的一级分类体系
- 不希望改变顶层结构
- 只需要在现有分类下细化

#### allowNewFolders（允许新建文件夹）

- **类型**：boolean
- **默认值**：true
- **说明**：是否允许新建任何文件夹

**禁用后**：
- AI 只能使用现有的文件夹
- 不能创建任何新文件夹（包括一级和二级）
- 所有书签必须放入现有文件夹

**使用场景**：
- 用户对现有结构满意
- 只想重新分配书签位置
- 不希望增加新的文件夹

**注意**：
- `strictHierarchy=true` 时，此选项自动为 false

#### preferOriginalPaths（优先保留原路径）

- **类型**：boolean
- **默认值**：true
- **说明**：是否优先保留书签的原始路径

**启用后**：
- AI 会参考书签的原始路径分布
- 优先将书签放回原来的位置
- 减少变动，降低用户适应成本

**禁用后**：
- AI 完全按语义分析重新分类
- 忽略原始路径
- 可能导致大量书签位置变化

### 自定义规则

#### workspaceAiOrganizeRules（自定义规则）

- **类型**：string（多行文本）
- **默认值**：空字符串
- **说明**：用户自定义的分类规则

**格式**：自由文本，每行一条规则

**示例**：
```
GitHub 相关放到「开发/代码托管」
设计工具放到「设计」
新闻网站放到「资讯」
学习资源放到「学习」
```

**优先级**：最高，AI 必须严格遵守

**使用技巧**：
- 使用中文「」标记文件夹路径
- 一行一条规则，简洁明了
- 可以指定一级或二级目录
- 支持模糊匹配（如"GitHub 相关"）

### 自定义 Prompt

#### enableWorkspaceAiOrganizeCustomPrompt（启用自定义 Prompt）

- **类型**：boolean
- **默认值**：false
- **说明**：是否使用自定义 Prompt 模板

#### workspaceAiOrganizePrompt（自定义 Prompt）

- **类型**：string（多行文本）
- **默认值**：空字符串
- **说明**：自定义的 Prompt 模板

**支持的变量**：
- `{{rules}}` - 用户自定义规则
- `{{domainSummariesJson}}` - 域名摘要 JSON
- `{{topLevelCount}}` - 一级目录数量
- `{{topHistoryLimit}}` - Top N 限制

**使用场景**：
- 调整整理风格
- 添加特定要求
- 适配不同语言
- 优化整理质量

**注意事项**：
- 必须保持 JSON 输出格式
- 必须包含 domainMoves 和 fallbackPath
- 建议基于默认模板修改

### 其他选项

#### workspaceAiOrganizeMaxBookmarks（域名批量大小）

- **类型**：number
- **范围**：50-2000
- **默认值**：300
- **说明**：每批处理的域名数量

**作用**：
- 控制单次 AI 请求的数据量
- 避免请求过大导致失败
- 当前实现：一次性发送所有批次

#### workspaceAiOrganizeVerboseLogs（详细日志）

- **类型**：boolean
- **默认值**：true
- **说明**：是否显示详细的日志信息

**启用后**：
- 显示所有 info 级别的日志
- 包括数据收集、分析、执行的详细过程
- 便于调试和了解整理过程

**禁用后**：
- 只显示 warn、error、success 级别的日志
- 减少日志输出，界面更简洁


## 执行整理

### 整理流程

#### 1. 清空工作区

**目标**：清空 TMarks 根文件夹，为新结构做准备

**操作**：
- 获取 TMarks 根文件夹 ID
- 遍历所有子节点
- 保留 "NewTab Home" 文件夹（用户的快捷方式）
- 删除其他所有文件夹和书签

**代码逻辑**：
```typescript
const rootChildren = await chrome.bookmarks.getChildren(newtabRootId)

for (const child of rootChildren) {
  // 保留 NewTab Home 文件夹
  if (!child.url && child.title === 'NewTab Home') {
    continue
  }
  // 删除其他节点
  await chrome.bookmarks.removeTree(child.id)
}
```

**注意事项**：
- 原始书签不会丢失，仍保留在浏览器其他位置
- 只是清空 TMarks 工作区，准备重新组织
- NewTab Home 文件夹保留，不影响用户的快捷方式

#### 2. 创建文件夹结构

**目标**：根据 AI 规划创建文件夹层级

**操作**：
- 遍历所有 AI 规划的路径
- 按路径层级创建文件夹
- 使用 Map 缓存路径到 ID 的映射
- 避免重复创建

**路径处理**：
```typescript
// 路径：开发/前端
// 步骤 1：创建「开发」文件夹
// 步骤 2：在「开发」下创建「前端」文件夹
```

**缓存机制**：
```typescript
const folderCache = new Map<string, string>()

// 缓存示例
folderCache.set('开发', 'folder-id-1')
folderCache.set('开发/前端', 'folder-id-2')
folderCache.set('设计', 'folder-id-3')
```

**函数**：`ensureFolderPath(rootId, path, cache)`

**返回**：目标文件夹 ID

#### 3. 复制书签

**目标**：将书签复制到目标文件夹

**操作**：
- 遍历所有原始书签
- 提取域名
- 查找 AI 规划的目标路径
- 在目标文件夹创建书签副本

**流程**：
```typescript
for (const bookmark of sourceBookmarks) {
  // 1. 提取域名
  const domain = extractDomain(bookmark.url)
  
  // 2. 查找目标路径
  const targetPath = domainToPath.get(domain) || fallbackPath
  
  // 3. 确保目标文件夹存在
  const targetParentId = await ensureFolderPath(rootId, targetPath, folderCache)
  
  // 4. 创建书签副本
  await chrome.bookmarks.create({
    parentId: targetParentId,
    title: bookmark.title,
    url: bookmark.url
  })
}
```

**进度报告**：
- 每 100 个书签报告一次进度
- 显示当前进度和总数
- 实时更新日志控制台

#### 4. 一级目录限制处理

**问题**：AI 可能返回超过限制的一级目录

**解决方案**：
1. 统计每个一级目录的域名数量
2. 按域名数量降序排序
3. 保留前 N 个最大的一级目录
4. 将超出的一级目录下的域名合并到 fallbackPath

**示例**：
```typescript
// 限制：5 个一级目录
// AI 返回：8 个一级目录

// 统计域名数量
const topLevelDomainCounts = new Map([
  ['开发', 150],
  ['工具', 80],
  ['学习', 60],
  ['设计', 45],
  ['社交', 30],
  ['购物', 15],  // 超出限制
  ['视频', 10],  // 超出限制
  ['新闻', 8]    // 超出限制
])

// 保留前 5 个
const keepTopLevels = ['开发', '工具', '学习', '设计', '社交']

// 合并超出的域名
for (const dm of domainMoves) {
  const topLevel = dm.path.split('/')[0]
  if (!keepTopLevels.includes(topLevel)) {
    dm.path = fallbackPath  // 合并到「其他/未分类」
  }
}
```

**日志记录**：
```
AI 返回 8 个一级目录，超过限制 5，已将 33 个域名合并到「其他/未分类」
保留的一级目录：['开发', '工具', '学习', '设计', '社交']
合并的一级目录：['购物', '视频', '新闻']
```

### 错误处理

#### 常见错误

1. **TMarks 文件夹不存在**
   - 错误：无法找到 TMarks 根文件夹
   - 处理：抛出错误，提示用户检查

2. **创建文件夹失败**
   - 错误：权限不足或文件夹名称非法
   - 处理：记录日志，跳过该文件夹

3. **复制书签失败**
   - 错误：URL 非法或权限不足
   - 处理：记录日志，跳过该书签

4. **AI 调用失败**
   - 错误：网络错误或 API Key 无效
   - 处理：抛出错误，显示详细信息

#### 错误恢复

**部分成功策略**：
- 文件夹创建失败不影响其他文件夹
- 书签复制失败不影响其他书签
- 保证尽可能多的书签被成功整理

**日志记录**：
- 记录所有错误详情
- 显示成功和失败的统计
- 提供错误列表供用户查看

## 进度监控

### 日志数据结构

```typescript
interface LogEntry {
  ts: number          // 时间戳
  level: string       // 日志级别
  step: string        // 步骤名称
  message: string     // 日志消息
  detail?: any        // 详细信息（可选）
}
```

### 日志级别

- **info**：普通信息（白色）
  - 数据收集、分析、执行的详细过程
  - 默认显示（可通过 verboseLogs 关闭）

- **warn**：警告信息（黄色）
  - 非致命错误
  - 需要用户注意的情况
  - 始终显示

- **error**：错误信息（红色）
  - 致命错误
  - 导致整理失败的问题
  - 始终显示

- **success**：成功信息（绿色）
  - 关键步骤完成
  - 最终结果
  - 始终显示

### 关键步骤日志

#### 1. start - 开始整理
```
[info] 开始 AI 整理：准备读取书签与配置
```

#### 2. root - 定位工作区根目录
```
[info] 已定位工作区根目录: folder-id-123
```

#### 3. collect - 收集书签
```
[info] 已读取书签: 1234 个；域名: 567 个
```

#### 4. usage - 加载快捷方式
```
[info] 已加载快捷方式: 89 个
```

#### 5. history - 读取历史记录
```
[info] 读取浏览历史：最近 30 天
[info] 历史记录: 4523 条，覆盖 345 个域名
```

#### 6. summarize - 生成域名汇总
```
[info] 已生成域名汇总: 567 个，批次数 2（每批 300 个），历史优先 Top 20
```

#### 7. ai_call - 调用 AI
```
[info] 准备调用 AI: openai/gpt-4o-mini
[success] AI 调用完成（返回长度 12345）
```

#### 8. parse - 解析 AI 结果
```
[success] 已解析 AI 规划: domainMoves=567，一级目录=5，fallbackPath=其他/未分类
```

#### 9. limit - 一级目录限制
```
[warn] AI 返回 8 个一级目录，超过限制 5，已将 33 个域名合并到「其他/未分类」
```

#### 10. cleanup - 清空工作区
```
[info] 已清空工作区：移除旧目录/书签 123 个
```

#### 11. folders - 创建文件夹
```
[info] 目录准备完成：新建目录 15 个
```

#### 12. copy - 复制书签
```
[info] 复制书签进度：100/1234
[info] 复制书签进度：200/1234
...
```

#### 13. done - 整理完成
```
[success] 整理完成：创建目录 15 个，复制书签 1234 个
```

### UI 显示

#### 日志控制台

**位置**：模态窗口（覆盖整个页面）

**尺寸**：900px × 460px（最大 95% 视口）

**布局**：
```
┌─────────────────────────────────────────┐
│ AI 整理控制台                    [自动滚动] [清空] [×] │
├─────────────────────────────────────────┤
│                                         │
│ [时间] [级别] [步骤] 消息内容            │
│ 详细信息（如果有）                       │
│                                         │
│ [时间] [级别] [步骤] 消息内容            │
│ ...                                     │
│                                         │
├─────────────────────────────────────────┤
│ 会话 ID: xxx-xxx-xxx        [复制日志]  │
└─────────────────────────────────────────┘
```

**功能**：
- 实时显示日志
- 自动滚动到底部（可关闭）
- 支持复制所有日志
- 支持清空日志
- 显示会话 ID

**颜色方案**：
- info: `text-white/80`
- warn: `text-yellow-300`
- error: `text-red-300`
- success: `text-green-300`

#### 进度显示

**整理按钮状态**：
```typescript
// 未开始
<button>开始 AI 整理</button>

// 整理中
<button disabled>整理中...</button>

// 完成
<button>开始 AI 整理</button>
```

**结果显示**：
```
✅ 整理完成：处理 1234 个书签，创建 15 个目录，复制 1234 个书签
```

**错误显示**：
```
❌ 整理失败：AI 调用失败，请检查 API Key 配置
```


## 核心代码文件

### 前端组件

#### `tab/src/newtab/components/settings/tabs/AITab.tsx`

**功能**：AI 整理设置界面

**主要组件**：
- 启用/禁用 AI 整理开关
- 自定义规则输入框
- 自定义 Prompt 编辑器
- 限制设置（域名数量、一级目录数量）
- 历史热度设置
- 层级策略设置
- 开始整理按钮
- 日志控制台

**子组件**：
- `CustomRulesSection` - 自定义规则部分
- `CustomPromptSection` - 自定义 Prompt 部分
- `LimitsSection` - 限制设置部分
- `HistoryHeatSection` - 历史热度部分
- `HierarchyStrategySection` - 层级策略部分
- `AIOrganizeConsole` - AI 整理控制台

### 核心逻辑

#### `tab/src/background/handlers/ai-organize/index.ts`

**功能**：AI 整理主处理器

**主要函数**：`handleAiOrganizeNewtabWorkspace(message)`

**流程**：
1. 解析配置参数
2. 定位 TMarks 根文件夹
3. 收集书签数据
4. 加载快捷方式和历史记录
5. 生成域名摘要
6. 调用 AI API
7. 解析 AI 响应
8. 执行整理操作
9. 返回结果

#### `tab/src/background/handlers/ai-organize/domain-processor.ts`

**功能**：域名处理与汇总

**主要函数**：
- `buildDomainToItemsMap()` - 构建域名到书签的映射
- `buildFolderPathCounts()` - 统计文件夹路径分布
- `buildDomainSummaries()` - 生成域名摘要列表

#### `tab/src/background/handlers/ai-organize/bookmark-operations.ts`

**功能**：书签操作

**主要函数**：
- `cleanupWorkspace()` - 清空工作区
- `createFolderStructure()` - 创建文件夹结构
- `copyBookmarks()` - 复制书签

### 辅助服务

#### `tab/src/background/services/bookmark-collector.ts`

**功能**：书签收集服务

**主要函数**：
- `collectAllBrowserBookmarks()` - 收集所有浏览器书签
- `ensureFolderPath()` - 确保文件夹路径存在
- `sanitizeAiOrganizePath()` - 清理 AI 整理路径

#### `tab/src/background/services/history-stats.ts`

**功能**：历史记录统计服务

**主要函数**：
- `collectDomainHistoryStats()` - 收集域名历史统计
- `aggregateShortcutStats()` - 聚合快捷方式统计

#### `tab/src/background/services/newtab-folder.ts`

**功能**：NewTab 文件夹管理服务

**主要函数**：
- `ensureNewtabRootFolder()` - 确保 TMarks 根文件夹存在
- `ensureNewtabHomeFolder()` - 确保 NewTab Home 文件夹存在
- `getBookmarksBarRootId()` - 获取书签栏根目录 ID

#### `tab/src/background/services/progress-reporter.ts`

**功能**：进度报告服务

**主要函数**：
- `reportAiOrganizeProgress()` - 报告 AI 整理进度

### 类型定义

#### `tab/src/background/handlers/ai-organize/types.ts`

**主要类型**：
- `AiOrganizePayload` - AI 整理请求参数
- `DomainSummary` - 域名摘要
- `DomainMove` - 域名移动规则

#### `tab/src/newtab/types.ts`

**主要类型**：
- `NewTabSettings` - NewTab 设置
- `Shortcut` - 快捷方式

### 常量定义

#### `tab/src/lib/constants/newtabPrompts.ts`

**主要常量**：
- `NEWTAB_WORKSPACE_ORGANIZE_PROMPT_TEMPLATE` - AI 整理 Prompt 模板

#### `tab/src/background/constants.ts`

**主要常量**：
- `TMARKS_ROOT_TITLE` - TMarks 根文件夹标题
- `TMARKS_HOME_TITLE` - NewTab Home 文件夹标题
- `HISTORY_MAX_RESULTS` - 历史记录最大结果数
- `DAY_MS` - 一天的毫秒数

## 使用示例

### 基础使用

1. 打开 NewTab 页面
2. 点击设置按钮
3. 切换到「AI 整理」标签页
4. 点击「开始 AI 整理」按钮
5. 等待整理完成
6. 查看整理结果

### 自定义规则

```
GitHub 相关放到「开发/代码托管」
设计工具放到「设计」
新闻网站放到「资讯」
学习资源放到「学习」
视频网站放到「娱乐/视频」
```

### 启用历史热度

1. 勾选「启用历史热度分析」
2. 设置分析天数：30 天
3. 设置 Top N：20
4. 开始整理

**效果**：
- 最常访问的 20 个域名放在一级目录
- 其他域名根据语义分析放在二级目录

### 严格层级模式

1. 勾选「禁止新建一级目录」
2. 开始整理

**效果**：
- AI 只能使用现有的一级目录
- 可以在现有一级目录下创建二级目录
- 保持顶层结构不变

### 仅重新分配模式

1. 勾选「禁止新建一级目录」
2. 取消勾选「允许新建文件夹」
3. 开始整理

**效果**：
- AI 只能使用现有的所有文件夹
- 不创建任何新文件夹
- 仅重新分配书签位置

## 性能优化

### 数据收集优化

**批量读取**：
- 使用 `chrome.bookmarks.getTree()` 一次性读取所有书签
- 避免多次 API 调用

**内存优化**：
- 使用 Map 存储域名映射，减少内存占用
- 及时释放不需要的数据

### AI 调用优化

**批量处理**：
- 每批最多 300 个域名
- 避免单次请求过大
- 当前实现：一次性发送所有批次

**缓存机制**：
- 缓存文件夹路径到 ID 的映射
- 避免重复查询和创建

### 书签操作优化

**批量创建**：
- 使用 `chrome.bookmarks.create()` 批量创建
- 每 100 个书签报告一次进度

**错误恢复**：
- 单个书签失败不影响其他书签
- 保证尽可能多的书签被成功整理

## 常见问题

### Q1: 整理后书签丢失了？

**A**: 不会丢失。原始书签仍保留在浏览器其他位置，只是 TMarks 工作区被清空并重新组织。

### Q2: 整理失败怎么办？

**A**: 
1. 检查 AI API Key 是否配置正确
2. 检查网络连接是否正常
3. 查看日志控制台的错误信息
4. 尝试减少域名批量大小

### Q3: 整理结果不满意？

**A**:
1. 添加自定义规则，明确指定分类
2. 调整一级目录数量限制
3. 启用历史热度分析
4. 使用自定义 Prompt 调整整理风格

### Q4: 如何保留现有结构？

**A**:
1. 勾选「优先保留原路径」
2. 勾选「禁止新建一级目录」
3. 添加自定义规则保护重要分类

### Q5: 整理速度慢？

**A**:
1. 减少域名批量大小
2. 关闭历史热度分析
3. 关闭详细日志
4. 检查网络速度

### Q6: 一级目录太多？

**A**:
1. 减少「一级目录数量限制」
2. 超出的目录会自动合并到「其他」分类

### Q7: 如何撤销整理？

**A**:
- 当前不支持撤销
- 建议整理前导出书签备份
- 可以手动恢复原有结构

## 最佳实践

### 1. 整理前准备

- 导出书签备份
- 清理无效书签
- 整理重复书签
- 确认 AI 配置正确

### 2. 自定义规则建议

- 使用简洁明了的规则
- 一行一条规则
- 使用中文「」标记路径
- 优先指定重要分类

### 3. 配置建议

**新手用户**：
- 使用默认配置
- 启用历史热度分析
- 一级目录数量：5

**高级用户**：
- 添加自定义规则
- 调整一级目录数量
- 使用自定义 Prompt
- 启用严格层级模式

### 4. 定期维护

- 每月整理一次
- 及时清理无效书签
- 更新自定义规则
- 调整分类结构

## 总结

NewTab AI 智能整理是一个强大的书签管理工具，通过结合热度分析、语义理解和用户规则，可以自动将杂乱的书签整理成清晰的文件夹结构。

**核心优势**：
- 域名级别整理，效率高
- 热度驱动，常用网站优先
- 智能分类，语义理解准确
- 层级控制，结构清晰
- 实时监控，过程透明

**适用场景**：
- 书签积累过多需要重组
- 希望按使用频率分类
- 需要合并相似域名
- 定期维护书签结构

**注意事项**：
- 整理前备份书签
- 合理配置参数
- 添加自定义规则
- 查看日志了解过程
