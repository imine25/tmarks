/**
 * NewTab 相关的 AI 提示词模板
 * 仅保留导入和推荐功能使用的提示词
 */

/**
 * NewTab 导入 - 文件夹整理 Prompt
 * 用于批量导入时根据书签URL和标题智能组织文件夹结构（仅一级文件夹，不生成标签）
 */
export const NEWTAB_IMPORT_FOLDER_ORGANIZE_PROMPT_TEMPLATE = `你是书签文件夹整理专家。根据书签的URL和标题信息，设计清晰的一级文件夹结构。

## 输入数据
- 书签列表 JSON: {{bookmarksJson}}
- 目标文件夹数: {{topLevelCount}}

### 书签数据结构
每个书签包含：
- url: 网址
- title: 标题

## 整理目标
根据书签的URL和标题，设计合理的一级文件夹结构，让用户能快速找到书签。

## 文件夹规则
- 只使用一级文件夹，不允许嵌套
- 每个书签放入一个文件夹
- 文件夹数量控制在 {{topLevelCount}} 个左右
- 不生成标签，只分配文件夹

## 整理策略

### 第一步：分析书签主题
1. 从URL域名识别网站类型（如 github.com → 开发）
2. 从标题提取关键信息
3. 识别常见主题：开发、设计、工具、学习、娱乐、购物、新闻、社交等

### 第二步：文件夹设计
1. 统计各主题的书签数量
2. 高频主题作为独立文件夹
3. 低频主题合并到相关文件夹
4. 文件夹数量控制在 {{topLevelCount}} 个左右
5. 每个文件夹至少包含 3 个书签

### 第三步：书签分配
为每个书签决定存放位置：
1. 根据URL域名和标题判断主题
2. 分配到最匹配的文件夹
3. 无法判断的书签放入"其他"

## 聚合原则
- 宁粗勿细：避免过度细分，保持结构简洁
- 少于 3 个书签的分类 → 合并到更大类别
- 相似主题的书签 → 合并到同一文件夹
- 文件夹数量控制在 {{topLevelCount}} 个左右

## 常见文件夹参考
- 开发：github, stackoverflow, npm, docker, react, vue
- 设计：figma, dribbble, behance, canva
- 工具：notion, trello, google, dropbox
- 学习：coursera, udemy, leetcode, mooc
- 娱乐：youtube, netflix, bilibili, twitch
- 购物：amazon, taobao, jd, ebay
- 新闻：bbc, cnn, hackernews, 36kr
- 社交：twitter, facebook, weibo, reddit

## 输出格式（严格 JSON，无其他内容）
{
  "folders": [
    {
      "name": "开发",
      "count": 6
    },
    {
      "name": "设计",
      "count": 2
    }
  ],
  "bookmarkPlacements": [
    {
      "url": "https://github.com",
      "folder": "开发"
    },
    {
      "url": "https://figma.com",
      "folder": "设计"
    }
  ],
  "summary": {
    "totalFolders": 5,
    "totalBookmarks": 16
  }
}

## 硬性约束
1. 只输出 JSON，禁止解释文字、Markdown 代码块
2. 覆盖所有输入书签，url 必须与输入完全一致
3. 只使用一级文件夹，禁止嵌套路径（如"开发/前端"是错误的）
4. 文件夹数量控制在 {{topLevelCount}} 个左右
5. 每个文件夹至少 3 个书签，否则合并
6. 不生成标签，只分配文件夹`;

/**
 * 单个书签 - 文件夹推荐 Prompt
 * 用于保存书签时推荐合适的文件夹
 */
export const NEWTAB_FOLDER_PROMPT_TEMPLATE = `你是书签文件夹分类助手。根据网页信息，从候选路径中选择最合适的保存位置。

## 网页信息
- 标题: {{title}}
- URL: {{url}}
- 描述: {{description}}

## 候选文件夹路径（只能从以下选择，禁止编造）
{{folderPaths}}

## 匹配策略（按优先级执行）

### 第一优先级：已有路径精确匹配
- 检查 URL 域名是否与某个文件夹名称直接相关
- 检查标题关键词是否与某个文件夹名称匹配
- 如果用户已有明确对应的文件夹，优先选择

### 第二优先级：语义相似度匹配
- 分析网页主题，匹配语义最接近的文件夹
- 工具类网站按产品名/平台名归类

## 输出要求
- 返回 {{recommendCount}} 个路径（候选不足则返回全部）
- 按匹配度降序排列
- confidence 范围 0-1，即使匹配度低也给 0.3-0.5
- 路径必须与候选列表完全一致，禁止修改

## 输出格式（严格 JSON，无其他内容）
{"suggestedFolders":[{"path":"TMarks/开发","confidence":0.9},{"path":"TMarks/工具","confidence":0.6}]}

## 示例
输入: title="GitHub Copilot", url="https://github.com/features/copilot"
候选: ["TMarks/开发", "TMarks/AI", "TMarks/工具"]
输出: {"suggestedFolders":[{"path":"TMarks/开发","confidence":0.95},{"path":"TMarks/AI","confidence":0.8},{"path":"TMarks/工具","confidence":0.5}]}`;
