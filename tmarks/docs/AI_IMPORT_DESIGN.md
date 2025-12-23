# TMarks AI 智能导入功能设计文档

## 1. 背景与目标

### 1.1 当前问题

现有导入流程繁琐，用户需要手动在外部 AI 工具中整理书签后再导入。

### 1.2 目标

在 TMarks WebUI 中集成 AI 整理功能，实现一站式智能导入。用户上传文件后可选择启用 AI 整理，系统自动生成标签和描述，预览确认后导入。

---

## 2. 方案概述

采用混合方案：用户配置自己的 AI API Key，前端直接调用 AI 服务。

核心流程：
1. 用户上传书签文件
2. 前端解析文件，提取书签列表（不调用服务端）
3. 用户选择是否启用 AI 整理
4. 如启用，前端使用用户输入的 API Key 直接调用 AI 服务（不经过 TMarks 服务端）
5. AI 整理在本地完成，展示预览对比界面
6. 用户可手动调整标签
7. 确认后，将整理好的数据一次性导入到 D1 数据库

关键设计：
- 所有整理工作在前端完成，减少服务端压力
- AI 调用直接从浏览器发起，用户数据不经过 TMarks 服务器
- 最终只有一次数据库写入操作，减少 D1 写入次数
- 用户使用自己的 API 额度，无需平台承担费用

---

## 3. AI 配置说明

### 3.1 配置方式

用户在导入时临时输入 API Key，仅用于当前整理操作，不保存到服务端。

支持的 AI 服务商：
- OpenAI（推荐 gpt-4o-mini）
- Claude
- DeepSeek（推荐，性价比高）
- 智谱 AI
- ModelScope
- SiliconFlow
- iFlow
- 自定义（兼容 OpenAI API 格式）

### 3.2 为什么不保存 API Key

- 安全性：API Key 不经过服务端，不存储在数据库
- 简单性：无需复杂的加密存储机制
- 灵活性：用户可以随时使用不同的 Key

---

## 4. 数据库设计

### 4.1 ai_settings 表（可选）

用于存储用户的 AI 服务偏好设置（服务商、模型等），不存储 API Key。

字段：
- id：主键
- user_id：用户 ID
- provider：偏好的服务商
- model：偏好的模型
- enabled：是否启用 AI 功能
- created_at、updated_at：时间戳

注意：API Key 不存储在数据库，用户每次使用时临时输入。

---

## 5. API 设计

### 5.1 导入 API（已有）

路径：POST /api/v1/import

请求体：
- format：导入格式（html/json）
- content：文件内容（字符串）
- options：导入选项

AI 整理后的导入：
- 前端将整理好的书签数据构建为 JSON 格式
- 一次性发送到导入 API
- 服务端批量写入 D1 数据库

### 5.2 AI 设置 API（可选）

用于保存用户的 AI 服务偏好，不涉及 API Key 存储。

- GET /api/v1/settings/ai - 获取偏好设置
- PUT /api/v1/settings/ai - 更新偏好设置

---

## 6. 前端设计

### 6.1 导入流程（三步骤）

步骤一 - 上传文件：
- 选择格式（HTML/JSON）
- 拖拽或点击上传
- 前端解析书签，显示数量
- 选择是否启用 AI 整理

步骤二 - AI 整理（可选）：
- 输入 API Key（临时使用，不保存）
- 选择服务商和模型
- 整理选项：生成标签、生成描述、标签规范化
- 显示预估 Token 消耗和费用
- 分批调用 AI，显示进度
- 整理完成后进入预览

步骤三 - 预览确认：
- 显示统计（总数、已生成标签数、新增标签数）
- 书签列表，可展开查看详情
- 对比原始标签 vs AI 生成标签
- 支持手动编辑标签
- 确认后一次性导入到 D1

### 6.2 数据流

```
上传文件
    ↓
前端解析（parseBookmarksFile）
    ↓
[可选] AI 整理（organizeBookmarks）
    ↓
预览对比（AiPreviewStep）
    ↓
用户确认
    ↓
构建 JSON 数据
    ↓
一次性发送到 /api/v1/import
    ↓
服务端批量写入 D1
```

### 6.3 关键组件

- ImportSection：主组件，管理步骤流程
- AiOrganizeStep：AI 整理步骤
- AiPreviewStep：预览对比步骤
- parseBookmarksFile：前端书签解析
- organizeBookmarks：AI 整理逻辑

---

## 7. AI 调用实现

### 7.1 调用位置

前端直接调用 AI API，不经过 TMarks 服务端。

优势：
- 用户数据隐私保护
- 减少服务端复杂度
- 用户使用自己的 API 额度
- 无需在服务端存储 API Key

### 7.2 AI 客户端

位置：tmarks/src/lib/ai/client.ts

功能：
- 统一的调用接口 callAI()
- 多服务商适配（OpenAI、Claude 等 API 格式差异）
- 超时处理（30 秒）
- 错误处理

### 7.3 分批处理

位置：tmarks/src/lib/ai/organize.ts

功能：
- 使用 AsyncGenerator 实现流式处理
- 默认批次大小 20 条
- 每批完成后更新进度
- 失败的批次保留原始数据，不中断整体流程

### 7.4 提示词设计

要点：
- 角色设定：书签整理专家
- 任务说明：为每个书签生成 2-5 个简洁标签
- 标签规范：每个标签 2-5 个字，通用易分类
- 优先使用已有标签
- 输出格式：JSON

---

## 8. 已完成的文件

### 后端
- tmarks/migrations/0002_d1_console_ai_settings.sql - AI 设置表（可选）
- tmarks/functions/api/v1/settings/ai.ts - AI 设置 API
- tmarks/functions/api/v1/settings/ai-test.ts - 连接测试 API

### 前端 - AI 模块
- tmarks/src/lib/ai/constants.ts - AI 服务常量
- tmarks/src/lib/ai/client.ts - AI 调用客户端
- tmarks/src/lib/ai/organize.ts - AI 整理逻辑

### 前端 - 导入模块
- tmarks/src/lib/import/html-parser.ts - 前端书签解析
- tmarks/src/components/import-export/ImportSection.tsx - 导入主组件
- tmarks/src/components/import-export/AiOrganizeStep.tsx - AI 整理步骤
- tmarks/src/components/import-export/AiPreviewStep.tsx - 预览对比步骤

### 前端 - 设置模块
- tmarks/src/services/ai-settings.ts - AI 设置服务
- tmarks/src/hooks/useAiSettings.ts - AI 设置 Hook
- tmarks/src/components/settings/tabs/AiSettingsTab.tsx - AI 设置页面

---

## 9. 安全考虑

API Key 处理：
- 用户在导入时临时输入，不保存到服务端
- 仅在内存中使用，页面关闭后清除
- AI 调用直接从浏览器发起，不经过 TMarks 服务器

数据隐私：
- 书签数据直接发送给 AI 服务商
- TMarks 服务端不接触用户的书签内容（AI 整理阶段）
- 只有最终确认导入时，数据才发送到 TMarks 服务端

---

## 10. 类型定义

### AI 相关类型（tmarks/src/lib/ai/）

AIProvider：服务商类型
- openai、claude、deepseek、zhipu、modelscope、siliconflow、iflow、custom

OrganizeOptions：整理选项
- generateTags：是否生成标签
- generateDescription：是否生成描述
- normalizeTags：是否规范化标签
- batchSize：批次大小

OrganizedBookmark：整理后的书签
- 继承 ParsedBookmark
- ai_tags：AI 生成的标签
- ai_description：AI 生成的描述
- original_tags：原始标签

OrganizeResult：整理结果
- bookmarks：整理后的书签数组
- newTags：新增的标签列表
- tokensUsed：Token 消耗

---

## 11. 使用说明

### 基本流程

1. 进入设置 → 数据 → 导入
2. 选择格式，上传书签文件
3. 勾选"启用 AI 智能整理"
4. 点击"下一步：AI 整理"
5. 输入 API Key，选择整理选项
6. 点击"开始 AI 整理"，等待完成
7. 预览整理结果，可手动调整
8. 点击"确认导入"

### 推荐配置

- 服务商：DeepSeek（性价比高）或 OpenAI gpt-4o-mini
- 批次大小：20 条（默认）
- 整理选项：建议只开启"生成标签"，描述消耗更多 Token

### 费用估算

- 100 个书签约消耗 8,000 tokens
- 使用 gpt-4o-mini 约 $0.001
- 使用 DeepSeek 约 $0.0005

---

## 12. 实现状态

✅ 已完成 - 所有代码已实现，无 TypeScript 错误

### 后端 API
- ✅ tmarks/functions/api/v1/settings/ai.ts - AI 设置 CRUD
- ✅ tmarks/functions/api/v1/settings/ai-test.ts - 连接测试

### 前端 AI 模块
- ✅ tmarks/src/lib/ai/constants.ts - 服务商常量
- ✅ tmarks/src/lib/ai/client.ts - AI 调用客户端
- ✅ tmarks/src/lib/ai/organize.ts - 书签整理逻辑

### 前端导入模块
- ✅ tmarks/src/lib/import/html-parser.ts - 书签解析
- ✅ tmarks/src/components/import-export/ImportSection.tsx - 导入主组件
- ✅ tmarks/src/components/import-export/AiOrganizeStep.tsx - AI 整理步骤
- ✅ tmarks/src/components/import-export/AiPreviewStep.tsx - 预览对比

### 前端设置模块
- ✅ tmarks/src/services/ai-settings.ts - API 服务
- ✅ tmarks/src/hooks/useAiSettings.ts - React Hook
- ✅ tmarks/src/components/settings/tabs/AiSettingsTab.tsx - 设置页面

### 数据库
- ✅ tmarks/migrations/0002_d1_console_ai_settings.sql - 迁移脚本

### 待完成
- ⏳ 在 Cloudflare D1 控制台执行数据库迁移
- ⏳ 部署测试
- ⏳ 用户验收测试

---

## 13. 未来扩展

- 批量整理现有书签：对已导入的书签进行 AI 重新分类
- 智能去重：AI 识别相似/重复书签
- 自动标签建议：新增书签时自动推荐标签
- 多语言支持：支持英文、日文等标签生成
