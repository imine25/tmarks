# TMarks AI 智能导入功能设计文档

## 1. 功能概述

在 TMarks WebUI 中集成 AI 整理功能，用户上传书签文件后可选择启用 AI 整理，系统自动生成标签和描述，预览确认后导入。

---

## 2. 用户流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         导入流程                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐                                                   │
│  │ 步骤1: 上传   │                                                   │
│  │ (upload)     │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                            │
│         ▼                                                            │
│  ┌──────────────────────────────────────┐                           │
│  │ 1. 选择格式 (HTML/JSON)               │                           │
│  │ 2. 上传文件                           │                           │
│  │ 3. 自动验证文件格式                    │                           │
│  │ 4. 自动解析书签列表                    │                           │
│  │ 5. 设置导入选项                        │                           │
│  │ 6. 选择是否启用 AI 整理                │                           │
│  └──────────────────────────────────────┘                           │
│         │                                                            │
│         ├─────────────────────────────────┐                         │
│         │ 不启用 AI                        │ 启用 AI                  │
│         ▼                                  ▼                         │
│  ┌──────────────┐                  ┌──────────────┐                 │
│  │ 直接导入      │                  │ 步骤2: AI整理 │                 │
│  │ (原始数据)    │                  │ (ai-organize)│                 │
│  └──────┬───────┘                  └──────┬───────┘                 │
│         │                                  │                         │
│         │                                  ▼                         │
│         │                          ┌──────────────────────────────┐ │
│         │                          │ 1. 输入 API Key (临时)        │ │
│         │                          │ 2. 选择整理选项               │ │
│         │                          │ 3. 查看预估消耗               │ │
│         │                          │ 4. 开始 AI 整理               │ │
│         │                          │ 5. 显示进度                   │ │
│         │                          └──────────────────────────────┘ │
│         │                                  │                         │
│         │                                  ▼                         │
│         │                          ┌──────────────┐                 │
│         │                          │ 步骤3: 预览   │                 │
│         │                          │ (ai-preview) │                 │
│         │                          └──────┬───────┘                 │
│         │                                  │                         │
│         │                                  ▼                         │
│         │                          ┌──────────────────────────────┐ │
│         │                          │ 1. 显示统计信息               │ │
│         │                          │ 2. 对比原始 vs AI 标签        │ │
│         │                          │ 3. 可手动编辑标签             │ │
│         │                          │ 4. 确认或放弃                 │ │
│         │                          └──────────────────────────────┘ │
│         │                                  │                         │
│         │                                  │ 确认导入                │
│         │                                  ▼                         │
│         │                          ┌──────────────┐                 │
│         └─────────────────────────►│ 导入到数据库  │                 │
│                                    └──────┬───────┘                 │
│                                           │                         │
│                                           ▼                         │
│                                    ┌──────────────┐                 │
│                                    │ 显示导入结果  │                 │
│                                    └──────────────┘                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 技术架构

### 3.1 数据流

```
用户上传文件
    ↓
前端解析 (parseBookmarksFile)
    ↓
[可选] AI 整理 (organizeBookmarks) ← 直接调用 AI API
    ↓
预览对比 (AiPreviewStep)
    ↓
用户确认
    ↓
构建 JSON 数据
    ↓
POST /api/v1/import
    ↓
服务端批量写入 D1
```

### 3.2 关键设计

- **前端解析**: 书签文件在浏览器端解析，不上传到服务器
- **AI 直连**: AI 调用直接从浏览器发起，用户数据不经过 TMarks 服务器
- **临时 Key**: API Key 仅在内存中使用，不保存到服务端
- **批量导入**: 最终只有一次数据库写入操作

---

## 4. 文件结构

```
tmarks/
├── src/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── constants.ts      # AI 服务商配置
│   │   │   ├── client.ts         # AI 调用客户端
│   │   │   └── organize.ts       # 书签整理逻辑
│   │   └── import/
│   │       └── html-parser.ts    # 前端书签解析
│   ├── components/
│   │   ├── import-export/
│   │   │   ├── ImportSection.tsx     # 导入主组件 (步骤控制)
│   │   │   ├── AiOrganizeStep.tsx    # AI 整理步骤
│   │   │   ├── AiPreviewStep.tsx     # 预览对比步骤
│   │   │   └── hooks/
│   │   │       ├── useImportState.ts   # 导入状态
│   │   │       └── useImportActions.ts # 导入操作
│   │   └── settings/
│   │       └── tabs/
│   │           └── AiSettingsTab.tsx # AI 设置页面
│   ├── services/
│   │   └── ai-settings.ts        # AI 设置 API 服务
│   └── hooks/
│       └── useAiSettings.ts      # AI 设置 Hook
├── functions/
│   └── api/v1/settings/
│       ├── ai.ts                 # AI 设置 API
│       └── ai-test.ts            # 连接测试 API
└── migrations/
    └── 0002_d1_console_ai_settings.sql  # 数据库迁移
```

---

## 5. 组件职责

### 5.1 ImportSection (主控制器)

**职责**: 管理导入流程的步骤切换和状态

**状态**:
- `currentStep`: 当前步骤 ('upload' | 'ai-organize' | 'ai-preview')
- `parsedBookmarks`: 解析后的书签列表
- `organizeResult`: AI 整理结果
- `enableAiOrganize`: 是否启用 AI 整理
- `importResult`: 导入结果

**流程控制**:
```
upload → (启用AI) → ai-organize → ai-preview → 导入
       → (不启用) → 直接导入
```

### 5.2 AiOrganizeStep (AI 整理)

**职责**: 配置 AI 参数并执行整理

**输入**:
- `bookmarks`: 待整理的书签列表
- `existingTags`: 已有标签 (用于优先匹配)

**输出**:
- `onComplete(result)`: 整理完成，进入预览
- `onSkip()`: 跳过整理，直接导入

**功能**:
- 输入临时 API Key
- 选择整理选项 (生成标签/描述)
- 显示预估消耗
- 分批调用 AI
- 显示进度

### 5.3 AiPreviewStep (预览对比)

**职责**: 展示整理结果，允许手动调整

**输入**:
- `result`: AI 整理结果

**输出**:
- `onConfirm(bookmarks)`: 确认导入
- `onBack()`: 返回重新整理
- `onSkip()`: 放弃整理结果

**功能**:
- 显示统计 (总数/已生成/新标签)
- 对比原始 vs AI 标签
- 手动编辑标签
- 使用原始标签

---

## 6. AI 服务配置

### 6.1 支持的服务商

| 服务商 | 默认模型 | API 格式 |
|--------|----------|----------|
| OpenAI | gpt-4o-mini | OpenAI |
| Claude | claude-3-haiku | Anthropic |
| DeepSeek | deepseek-chat | OpenAI 兼容 |
| 智谱 AI | glm-4-flash | OpenAI 兼容 |
| SiliconFlow | Qwen2.5-7B | OpenAI 兼容 |
| 自定义 | - | OpenAI 兼容 |

### 6.2 API Key 处理

- **导入时**: 用户临时输入，仅在内存中使用
- **设置页**: 可保存偏好设置 (服务商/模型)，API Key 加密存储
- **安全性**: AI 调用直接从浏览器发起，不经过 TMarks 服务器

---

## 7. AI 整理实现

### 7.1 提示词设计 (organize.ts)

```
角色: 书签整理专家
任务: 为每个书签生成 2-5 个简洁标签
规范:
  - 标签 2-5 个字
  - 通用易分类
  - 优先使用已有标签
输出: JSON 格式
```

### 7.2 分批处理

- 默认批次大小: 20 条
- 使用 AsyncGenerator 流式处理
- 每批完成后更新进度
- 失败的批次保留原始数据

### 7.3 费用估算

| 书签数量 | 预估 Token | gpt-4o-mini | DeepSeek |
|----------|------------|-------------|----------|
| 100 | ~8,000 | $0.001 | $0.0005 |
| 500 | ~40,000 | $0.006 | $0.003 |
| 1000 | ~80,000 | $0.012 | $0.006 |

---

## 8. 数据库设计

### ai_settings 表

```sql
CREATE TABLE ai_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL DEFAULT 'openai',
    api_keys_encrypted TEXT,      -- 加密存储
    api_urls TEXT,                -- JSON 格式
    model TEXT,
    custom_prompt TEXT,
    enable_custom_prompt INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
);
```

---

## 9. API 设计

### 9.1 AI 设置 API

```
GET  /api/v1/settings/ai      # 获取设置 (API Key 脱敏)
PUT  /api/v1/settings/ai      # 更新设置
POST /api/v1/settings/ai/test # 测试连接
```

### 9.2 导入 API (已有)

```
POST /api/v1/import
Body: {
  format: 'json',
  content: '{"bookmarks": [...]}',
  options: {...}
}
```

---

## 10. 实现状态

### ✅ 已完成

| 模块 | 文件 | 状态 |
|------|------|------|
| AI 常量 | `lib/ai/constants.ts` | ✅ |
| AI 客户端 | `lib/ai/client.ts` | ✅ |
| AI 整理 | `lib/ai/organize.ts` | ✅ |
| 书签解析 | `lib/import/html-parser.ts` | ✅ |
| 导入主组件 | `components/import-export/ImportSection.tsx` | ✅ |
| AI 整理步骤 | `components/import-export/AiOrganizeStep.tsx` | ✅ |
| 预览步骤 | `components/import-export/AiPreviewStep.tsx` | ✅ |
| AI 设置服务 | `services/ai-settings.ts` | ✅ |
| AI 设置 Hook | `hooks/useAiSettings.ts` | ✅ |
| AI 设置页面 | `components/settings/tabs/AiSettingsTab.tsx` | ✅ |
| 后端 API | `functions/api/v1/settings/ai.ts` | ✅ |
| 连接测试 | `functions/api/v1/settings/ai-test.ts` | ✅ |
| 数据库迁移 | `migrations/0002_d1_console_ai_settings.sql` | ✅ |

### ⏳ 待完成

1. **执行数据库迁移** - 在 Cloudflare D1 控制台运行 SQL
2. **部署测试** - 部署到 Cloudflare Pages
3. **用户验收测试** - 测试完整流程

---

## 11. 使用说明

### 基本流程

1. 进入 **设置 → 数据 → 导入数据**
2. 选择格式，上传书签文件
3. 勾选 **"启用 AI 智能整理"**
4. 点击 **"下一步：AI 整理"**
5. 输入 API Key，选择整理选项
6. 点击 **"开始 AI 整理"**
7. 预览整理结果，可手动调整
8. 点击 **"确认导入"**

### AI 设置页面

位置: **设置 → AI**

功能:
- 选择默认服务商
- 保存 API Key (加密存储)
- 测试连接
- 启用/禁用 AI 功能

---

## 12. 未来扩展

- 批量整理现有书签
- 智能去重
- 自动标签建议
- 多语言支持
