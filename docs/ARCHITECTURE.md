# TMarks 项目架构文档

## 项目概述

TMarks 是一个智能书签管理系统，包含三个主要部分：
1. **浏览器扩展 (tab/)** - Chrome/Edge 扩展，提供 AI 标签推荐和书签保存功能
2. **后端 API (tmarks/functions/)** - Cloudflare Pages Functions，提供 RESTful API
3. **Web 前端 (tmarks/src/)** - React SPA，提供书签管理界面

---

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TMarks 系统架构                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  浏览器扩展      │     │   Web 前端       │     │   公开分享页     │       │
│  │  (tab/)         │     │  (tmarks/src/)  │     │  (/share/:slug) │       │
│  │                 │     │                 │     │                 │       │
│  │  - Popup        │     │  - 书签管理      │     │  - 只读展示      │       │
│  │  - Options      │     │  - 标签管理      │     │  - 无需登录      │       │
│  │  - Background   │     │  - 标签页组      │     │                 │       │
│  │  - Content      │     │  - 设置/导入导出 │     │                 │       │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘       │
│           │                       │                       │                 │
│           │ API Key               │ JWT Token             │ Public          │
│           │                       │                       │                 │
│           ▼                       ▼                       ▼                 │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    Cloudflare Pages Functions                    │       │
│  │                      (tmarks/functions/)                         │       │
│  │                                                                  │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │       │
│  │  │ /api/tab/*   │  │ /api/v1/*    │  │ /api/public/*│           │       │
│  │  │ (扩展专用)    │  │ (Web前端)    │  │ (公开访问)   │           │       │
│  │  │ API Key认证  │  │ JWT认证      │  │ 无需认证     │           │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                         数据存储层                               │       │
│  │                                                                  │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │       │
│  │  │ Cloudflare   │  │ Cloudflare   │  │ Cloudflare   │           │       │
│  │  │ D1 Database  │  │ R2 Storage   │  │ KV Store     │           │       │
│  │  │ (SQLite)     │  │ (快照/图片)   │  │ (缓存)       │           │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 数据流程图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           书签保存流程                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  用户点击扩展图标                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────┐    Content Script    ┌─────────────┐                      │
│  │   Popup     │ ◄──────────────────► │  当前网页    │                      │
│  │             │   提取页面信息         │             │                      │
│  └──────┬──────┘                      └─────────────┘                      │
│         │                                                                   │
│         │ 页面信息 (title, url, description, thumbnail)                     │
│         ▼                                                                   │
│  ┌─────────────┐                                                           │
│  │ Background  │                                                           │
│  │  Service    │                                                           │
│  └──────┬──────┘                                                           │
│         │                                                                   │
│         ├──────────────────────────────────────────┐                       │
│         │                                          │                       │
│         ▼                                          ▼                       │
│  ┌─────────────┐                           ┌─────────────┐                 │
│  │  AI 服务     │                           │ TMarks API  │                 │
│  │ (标签推荐)   │                           │ (保存书签)   │                 │
│  │             │                           │             │                 │
│  │ - OpenAI    │                           │ POST        │                 │
│  │ - Claude    │                           │ /api/tab/   │                 │
│  │ - DeepSeek  │                           │ bookmarks   │                 │
│  │ - 智谱      │                           │             │                 │
│  │ - 硅基流动  │                           └──────┬──────┘                 │
│  └─────────────┘                                  │                        │
│                                                   ▼                        │
│                                            ┌─────────────┐                 │
│                                            │ D1 Database │                 │
│                                            │             │                 │
│                                            │ - bookmarks │                 │
│                                            │ - tags      │                 │
│                                            │ - bookmark_ │                 │
│                                            │   tags      │                 │
│                                            └─────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 目录结构

```
aitmarks/
├── tab/                          # 浏览器扩展
│   ├── src/
│   │   ├── background/           # Service Worker (后台脚本)
│   │   │   └── index.ts          # 消息处理、API调用
│   │   ├── content/              # Content Script (内容脚本)
│   │   │   ├── index.ts          # 页面信息提取
│   │   │   └── singlefile-*.ts   # 网页快照捕获
│   │   ├── popup/                # 弹出窗口
│   │   │   ├── Popup.tsx         # 书签保存界面
│   │   │   ├── ModeSelector.tsx  # 模式选择
│   │   │   └── TabCollectionView.tsx  # 标签页收纳
│   │   ├── options/              # 设置页面
│   │   │   └── Options.tsx       # AI/API配置
│   │   ├── components/           # 共享组件
│   │   ├── lib/
│   │   │   ├── api/tmarks/       # TMarks API 客户端
│   │   │   ├── providers/        # AI 服务提供商
│   │   │   ├── services/         # 业务逻辑服务
│   │   │   ├── store/            # Zustand 状态管理
│   │   │   └── utils/            # 工具函数
│   │   └── types/                # TypeScript 类型定义
│   └── manifest.json             # 扩展配置
│
├── tmarks/                       # 后端 + Web前端
│   ├── functions/                # Cloudflare Pages Functions (后端API)
│   │   ├── api/
│   │   │   ├── tab/              # 扩展专用 API (API Key 认证)
│   │   │   │   ├── bookmarks/    # 书签 CRUD
│   │   │   │   ├── tags/         # 标签 CRUD
│   │   │   │   ├── tab-groups/   # 标签页组
│   │   │   │   ├── me.ts         # 用户信息
│   │   │   │   └── search.ts     # 搜索
│   │   │   ├── v1/               # Web前端 API (JWT 认证)
│   │   │   │   ├── auth/         # 登录/注册/刷新
│   │   │   │   ├── bookmarks/    # 书签管理
│   │   │   │   ├── tags/         # 标签管理
│   │   │   │   ├── tab-groups/   # 标签页组
│   │   │   │   ├── settings/     # 设置 (API Keys, 分享)
│   │   │   │   └── import.ts     # 导入导出
│   │   │   ├── public/           # 公开 API (无需认证)
│   │   │   └── share/            # 分享页面 API
│   │   ├── lib/                  # 工具库
│   │   │   ├── cache/            # 缓存管理
│   │   │   ├── api-key/          # API Key 管理
│   │   │   ├── image-upload.ts   # 图片上传到 R2
│   │   │   ├── jwt.ts            # JWT 处理
│   │   │   ├── tags.ts           # 标签处理
│   │   │   └── types.ts          # 类型定义
│   │   └── middleware/           # 中间件
│   │       ├── auth.ts           # JWT 认证
│   │       ├── api-key-auth.ts   # API Key 认证
│   │       └── dual-auth.ts      # 双重认证
│   │
│   ├── src/                      # Web 前端 (React)
│   │   ├── components/           # UI 组件
│   │   │   ├── bookmarks/        # 书签相关组件
│   │   │   ├── tags/             # 标签相关组件
│   │   │   ├── tab-groups/       # 标签页组组件
│   │   │   └── layout/           # 布局组件
│   │   ├── pages/                # 页面
│   │   │   ├── bookmarks/        # 书签管理页
│   │   │   ├── tab-groups/       # 标签页组页
│   │   │   ├── settings/         # 设置页
│   │   │   └── share/            # 公开分享页
│   │   ├── services/             # API 调用服务
│   │   ├── hooks/                # React Hooks
│   │   └── stores/               # Zustand 状态
│   │
│   ├── migrations/               # 数据库迁移
│   │   ├── 0001_schema.sql       # 完整数据库结构
│   │   └── 0001_d1_console.sql   # D1 控制台版本
│   │
│   └── shared/                   # 前后端共享类型
│       └── import-export-types.ts
│
└── docs/                         # 文档
    └── ARCHITECTURE.md           # 本文档
```

---

## API 路由说明

### 扩展专用 API (`/api/tab/*`) - API Key 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tab/bookmarks | 获取书签列表 |
| POST | /api/tab/bookmarks | 创建书签 |
| GET | /api/tab/bookmarks/:id | 获取单个书签 |
| PATCH | /api/tab/bookmarks/:id | 更新书签 |
| DELETE | /api/tab/bookmarks/:id | 删除书签 |
| POST | /api/tab/bookmarks/:id/snapshots | 创建快照 |
| POST | /api/tab/bookmarks/:id/snapshots-v2 | 创建快照V2 |
| GET | /api/tab/tags | 获取标签列表 |
| POST | /api/tab/tags | 创建标签 |
| GET | /api/tab/tab-groups | 获取标签页组 |
| POST | /api/tab/tab-groups | 创建标签页组 |
| GET | /api/tab/me | 获取用户信息 |
| GET | /api/tab/search | 全局搜索 |

### Web 前端 API (`/api/v1/*`) - JWT 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/v1/auth/login | 登录 |
| POST | /api/v1/auth/register | 注册 |
| POST | /api/v1/auth/refresh | 刷新 Token |
| POST | /api/v1/auth/logout | 登出 |
| GET | /api/v1/bookmarks | 获取书签列表 |
| POST | /api/v1/bookmarks | 创建书签 |
| POST | /api/v1/bookmarks/bulk | 批量操作 |
| GET | /api/v1/tags | 获取标签列表 |
| GET | /api/v1/preferences | 获取用户偏好 |
| PATCH | /api/v1/preferences | 更新用户偏好 |
| GET | /api/v1/settings/api-keys | 获取 API Keys |
| POST | /api/v1/settings/api-keys | 创建 API Key |
| GET | /api/v1/export | 导出数据 |
| POST | /api/v1/import | 导入数据 |

---

## 数据库表结构

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              数据库 ER 图                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐               │
│  │   users     │       │  bookmarks  │       │    tags     │               │
│  ├─────────────┤       ├─────────────┤       ├─────────────┤               │
│  │ id (PK)     │◄──┐   │ id (PK)     │   ┌──►│ id (PK)     │               │
│  │ username    │   │   │ user_id(FK) │───┘   │ user_id(FK) │───┐           │
│  │ email       │   │   │ title       │       │ name        │   │           │
│  │ password_   │   │   │ url         │       │ color       │   │           │
│  │   hash      │   │   │ description │       │ click_count │   │           │
│  │ role        │   │   │ cover_image │       │ created_at  │   │           │
│  │ public_     │   │   │ favicon     │       │ deleted_at  │   │           │
│  │   share_    │   │   │ is_pinned   │       └─────────────┘   │           │
│  │   enabled   │   │   │ is_archived │                         │           │
│  │ public_slug │   │   │ is_public   │                         │           │
│  └─────────────┘   │   │ click_count │                         │           │
│         │          │   │ has_snapshot│                         │           │
│         │          │   │ created_at  │                         │           │
│         │          │   │ deleted_at  │                         │           │
│         │          │   └──────┬──────┘                         │           │
│         │          │          │                                │           │
│         │          │          │                                │           │
│         │          │   ┌──────▼──────┐                         │           │
│         │          │   │ bookmark_   │                         │           │
│         │          │   │   tags      │◄────────────────────────┘           │
│         │          │   ├─────────────┤                                     │
│         │          │   │ bookmark_id │                                     │
│         │          │   │ tag_id      │                                     │
│         │          │   │ user_id     │                                     │
│         │          │   │ created_at  │                                     │
│         │          │   └─────────────┘                                     │
│         │          │                                                       │
│         │          │   ┌─────────────┐       ┌─────────────┐               │
│         │          │   │ bookmark_   │       │ bookmark_   │               │
│         │          │   │  snapshots  │       │   images    │               │
│         │          │   ├─────────────┤       ├─────────────┤               │
│         │          └──►│ bookmark_id │       │ bookmark_id │               │
│         │              │ user_id     │       │ user_id     │               │
│         │              │ version     │       │ image_hash  │               │
│         │              │ r2_key      │       │ r2_key      │               │
│         │              │ file_size   │       │ file_size   │               │
│         │              │ created_at  │       │ created_at  │               │
│         │              └─────────────┘       └─────────────┘               │
│         │                                                                  │
│         │          ┌─────────────┐       ┌─────────────┐                   │
│         │          │ tab_groups  │       │ tab_group_  │                   │
│         │          ├─────────────┤       │   items     │                   │
│         └─────────►│ id (PK)     │◄──────┤─────────────┤                   │
│                    │ user_id(FK) │       │ group_id    │                   │
│                    │ title       │       │ title       │                   │
│                    │ parent_id   │       │ url         │                   │
│                    │ is_folder   │       │ favicon     │                   │
│                    │ is_deleted  │       │ position    │                   │
│                    │ created_at  │       │ created_at  │                   │
│                    └─────────────┘       └─────────────┘                   │
│                                                                             │
│         │          ┌─────────────┐                                         │
│         │          │  api_keys   │                                         │
│         │          ├─────────────┤                                         │
│         └─────────►│ id (PK)     │                                         │
│                    │ user_id(FK) │                                         │
│                    │ key_hash    │                                         │
│                    │ key_prefix  │                                         │
│                    │ name        │                                         │
│                    │ permissions │                                         │
│                    │ status      │                                         │
│                    │ expires_at  │                                         │
│                    └─────────────┘                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 认证流程

### API Key 认证 (浏览器扩展)

```
┌─────────────┐                    ┌─────────────┐
│  扩展       │                    │  后端 API   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  请求 + X-API-Key Header         │
       │─────────────────────────────────►│
       │                                  │
       │                           验证 API Key
       │                           查询 api_keys 表
       │                           检查权限和状态
       │                                  │
       │  响应数据                         │
       │◄─────────────────────────────────│
       │                                  │
```

### JWT 认证 (Web 前端)

```
┌─────────────┐                    ┌─────────────┐
│  Web 前端   │                    │  后端 API   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  POST /api/v1/auth/login         │
       │  { username, password }          │
       │─────────────────────────────────►│
       │                                  │
       │                           验证用户名密码
       │                           生成 JWT Token
       │                                  │
       │  { accessToken, refreshToken }   │
       │◄─────────────────────────────────│
       │                                  │
       │  请求 + Authorization: Bearer    │
       │─────────────────────────────────►│
       │                                  │
       │                           验证 JWT
       │                           提取 user_id
       │                                  │
       │  响应数据                         │
       │◄─────────────────────────────────│
       │                                  │
```

---

## 技术栈

### 浏览器扩展 (tab/)
- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **构建**: Vite
- **本地存储**: IndexedDB (Dexie.js)

### 后端 (tmarks/functions/)
- **运行时**: Cloudflare Workers
- **数据库**: Cloudflare D1 (SQLite)
- **对象存储**: Cloudflare R2
- **缓存**: Cloudflare KV
- **认证**: JWT + API Key

### Web 前端 (tmarks/src/)
- **框架**: React 18 + TypeScript
- **路由**: React Router v6
- **状态管理**: Zustand + React Query
- **样式**: Tailwind CSS
- **构建**: Vite

---

## 环境变量

### 后端 (wrangler.toml)
```toml
[vars]
JWT_SECRET = "your-jwt-secret"
ENCRYPTION_KEY = "your-encryption-key"
R2_PUBLIC_URL = "https://r2.example.com"
CORS_ALLOWED_ORIGINS = "https://example.com"
ALLOW_REGISTRATION = "true"
```

### 扩展 (chrome.storage)
- `bookmarkSite.apiUrl` - TMarks API 地址
- `bookmarkSite.apiKey` - API Key
- `aiConfig.provider` - AI 服务提供商
- `aiConfig.apiKeys` - AI API Keys
- `preferences.enableAI` - 是否启用 AI 推荐
