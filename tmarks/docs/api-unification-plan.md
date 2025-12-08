# TMarks API 统一化方案

## 📊 现状分析（基于 MCP 代码库分析）

### 当前 API 架构

```
/api
├── /v1/*              ✅ Web 前端 API (JWT Token)
│   ├── /auth          ✅ 认证相关
│   ├── /bookmarks     ✅ 书签管理
│   ├── /tags          ✅ 标签管理
│   ├── /tab-groups    ⚠️ 字段不完整
│   ├── /settings      ✅ 设置管理
│   ├── /preferences   ✅ 用户偏好
│   ├── /export        ✅ 导出功能
│   └── /import        ✅ 导入功能
│
├── /tab/*             ✅ 浏览器扩展 API (API Key 或 JWT)
│   ├── /bookmarks     ✅ 书签管理（完整）
│   ├── /tags          ✅ 标签管理（完整）
│   ├── /tab-groups    ✅ 标签页组（完整）
│   ├── /me            ✅ 用户信息
│   ├── /search        ✅ 全局搜索
│   └── /statistics    ✅ 统计信息
│
├── /tab-groups/*      ⚠️ 旧 API（与 /v1/tab-groups 重复）
├── /tags/*            ⚠️ 旧 API（与 /v1/tags 重复）
├── /me                ⚠️ 旧 API（与 /tab/me 重复）
├── /search            ⚠️ 旧 API（与 /tab/search 重复）
├── /statistics/*      ⚠️ 旧 API（与 /tab/statistics 重复）
│
├── /public/*          ✅ 公开分享（无需认证）
├── /share/*           ✅ 分享链接（Token）
└── /snapshot-images/* ✅ 快照图片
```

### 使用情况分析

#### Web 前端 (tmarks/src)
- ✅ 使用 `apiClient` (baseURL = `/api/v1`)
- ✅ 所有调用都通过 `/api/v1/*`
- ✅ 未发现使用旧 API

#### 浏览器扩展 (tab/src)
- ✅ 使用 `TMarksClient` (baseURL = `/api`)
- ✅ 调用 `/api/v1/tab-groups` (通过 `/v1/tab-groups`)
- ✅ 调用 `/api/tab/*` (通过 `/tab/*`)
- ⚠️ UserAPI 调用 `/api/me` 和 `/api/search` (旧路径)

---

## 🎯 统一化目标

### 1. API 路径规范
- **`/api/v1/*`** - Web 前端专用（JWT Token）
- **`/api/tab/*`** - 浏览器扩展专用（API Key 或 JWT）
- **废弃** - 所有根路径下的旧 API

### 2. 字段一致性
- `/api/v1/tab-groups` 与 `/api/tab/tab-groups` 字段完全一致
- 所有 API 返回完整的数据结构

### 3. 认证方式
- `/api/v1/*` - 仅 JWT Token
- `/api/tab/*` - API Key 或 JWT Token（双重认证）

---

## 📋 统一化方案

### Phase 1: 完善 `/api/v1/tab-groups` (高优先级)

#### 1.1 修改 `/api/v1/tab-groups/[id].ts`

**目标**: 与 `/api/tab/tab-groups/[id].ts` 保持完全一致

```typescript
// tmarks/functions/api/v1/tab-groups/[id].ts

interface TabGroupRow {
  id: string
  user_id: string
  title: string
  color: string | null          // ✅ 添加
  tags: string | null           // ✅ 添加
  parent_id: string | null      // ✅ 添加
  is_folder: number             // ✅ 添加
  is_deleted: number            // ✅ 添加
  deleted_at: string | null     // ✅ 添加
  position: number              // ✅ 添加
  created_at: string
  updated_at: string
}

interface UpdateTabGroupRequest {
  title?: string
  color?: string | null         // ✅ 添加
  tags?: string[] | null        // ✅ 添加
  parent_id?: string | null     // ✅ 已有
  position?: number             // ✅ 已有
}

// PATCH 处理逻辑
if (body.color !== undefined) {
  updates.push('color = ?')
  params.push(body.color)
}

if (body.tags !== undefined) {
  updates.push('tags = ?')
  params.push(body.tags ? JSON.stringify(body.tags) : null)
}
```

#### 1.2 修改 `/api/v1/tab-groups/index.ts`

**目标**: GET 和 POST 返回完整字段

```typescript
// tmarks/functions/api/v1/tab-groups/index.ts

interface TabGroupRow {
  id: string
  user_id: string
  title: string
  color: string | null          // ✅ 添加
  tags: string | null           // ✅ 添加
  parent_id: string | null      // ✅ 添加
  is_folder: number             // ✅ 添加
  is_deleted: number            // ✅ 添加
  deleted_at: string | null     // ✅ 添加
  position: number              // ✅ 添加
  created_at: string
  updated_at: string
}
```

---

### Phase 2: 迁移浏览器扩展 API 调用 (中优先级)

#### 2.1 修改 `tab/src/lib/api/tmarks/user.ts`

**问题**: 当前调用 `/api/me` 和 `/api/search`（旧路径）

**修改前**:
```typescript
async getMe(): Promise<GetUserResponse> {
  return this.get<GetUserResponse>('/me');
}

async search(params: SearchParams): Promise<SearchResponse> {
  return this.get<SearchResponse>('/search', params);
}
```

**修改后**:
```typescript
async getMe(): Promise<GetUserResponse> {
  return this.get<GetUserResponse>('/tab/me');  // ✅ 使用 /tab/me
}

async search(params: SearchParams): Promise<SearchResponse> {
  return this.get<SearchResponse>('/tab/search', params);  // ✅ 使用 /tab/search
}
```

---

### Phase 3: 清理旧 API 文件 (低优先级)

#### 3.1 确认无依赖

**检查清单**:
- [x] Web 前端不使用旧 API ✅
- [ ] 浏览器扩展迁移完成
- [ ] 没有外部服务调用旧 API
- [ ] 没有脚本或工具使用旧 API

#### 3.2 删除旧 API 文件

```bash
# 备份（可选）
mkdir -p tmarks/functions/api/_deprecated_backup_2024
mv tmarks/functions/api/tab-groups tmarks/functions/api/_deprecated_backup_2024/
mv tmarks/functions/api/tags tmarks/functions/api/_deprecated_backup_2024/
mv tmarks/functions/api/me.ts tmarks/functions/api/_deprecated_backup_2024/
mv tmarks/functions/api/search.ts tmarks/functions/api/_deprecated_backup_2024/
mv tmarks/functions/api/statistics tmarks/functions/api/_deprecated_backup_2024/

# 或直接删除
rm -rf tmarks/functions/api/tab-groups
rm -rf tmarks/functions/api/tags
rm tmarks/functions/api/me.ts
rm tmarks/functions/api/search.ts
rm -rf tmarks/functions/api/statistics
```

#### 3.3 更新 `/api/index.ts`

**修改前**:
```typescript
endpoints: {
  bookmarks: {
    list: 'GET /api/bookmarks',
    // ...
  },
  tags: {
    list: 'GET /api/tags',
    // ...
  },
  user: {
    me: 'GET /api/me',
  },
  search: {
    global: 'GET /api/search?q=keyword',
  },
}
```

**修改后**:
```typescript
endpoints: {
  v1: {
    bookmarks: 'GET /api/v1/bookmarks',
    tags: 'GET /api/v1/tags',
    tabGroups: 'GET /api/v1/tab-groups',
    // ...
  },
  tab: {
    bookmarks: 'GET /api/tab/bookmarks',
    tags: 'GET /api/tab/tags',
    tabGroups: 'GET /api/tab/tab-groups',
    me: 'GET /api/tab/me',
    search: 'GET /api/tab/search',
    // ...
  },
}
```

---

## 🔧 实施步骤

### Step 1: 完善 `/api/v1/tab-groups` ⚡ 立即执行

**文件**:
1. `tmarks/functions/api/v1/tab-groups/[id].ts`
2. `tmarks/functions/api/v1/tab-groups/index.ts`

**修改内容**:
- 添加完整的 TabGroupRow 字段
- 添加 color 和 tags 的更新逻辑
- 确保 GET/POST/PATCH 都返回完整数据

**测试**:
- 拖拽功能正常
- 创建文件夹正常
- 锁定/解锁功能正常

---

### Step 2: 迁移浏览器扩展 API 调用 📅 1-2 天内

**文件**:
1. `tab/src/lib/api/tmarks/user.ts`

**修改内容**:
- `/me` → `/tab/me`
- `/search` → `/tab/search`

**测试**:
- 浏览器扩展用户信息显示正常
- 浏览器扩展搜索功能正常

---

### Step 3: 清理旧 API 文件 📅 1 周后

**前提**:
- Step 1 和 Step 2 完成
- 生产环境运行稳定
- 确认无外部依赖

**操作**:
1. 备份旧 API 文件
2. 删除旧 API 文件
3. 更新 API 文档
4. 部署验证

---

## 📊 字段对比表

### TabGroupRow 字段对比

| 字段 | `/api/v1/tab-groups` (修改前) | `/api/tab/tab-groups` | 修改后 |
|------|-------------------------------|----------------------|--------|
| id | ✅ | ✅ | ✅ |
| user_id | ✅ | ✅ | ✅ |
| title | ✅ | ✅ | ✅ |
| color | ❌ | ✅ | ✅ |
| tags | ❌ | ✅ | ✅ |
| parent_id | ❌ | ✅ | ✅ |
| is_folder | ❌ | ✅ | ✅ |
| is_deleted | ❌ | ✅ | ✅ |
| deleted_at | ❌ | ✅ | ✅ |
| position | ❌ | ✅ | ✅ |
| created_at | ✅ | ✅ | ✅ |
| updated_at | ✅ | ✅ | ✅ |

### UpdateTabGroupRequest 字段对比

| 字段 | `/api/v1/tab-groups` (修改前) | `/api/tab/tab-groups` | 修改后 |
|------|-------------------------------|----------------------|--------|
| title | ✅ | ✅ | ✅ |
| color | ❌ | ✅ | ✅ |
| tags | ❌ | ✅ | ✅ |
| parent_id | ✅ (已修复) | ✅ | ✅ |
| position | ✅ (已修复) | ✅ | ✅ |

---

## 🎯 预期效果

### 统一后的 API 架构

```
/api
├── /v1/*              ✅ Web 前端 API (JWT Token) - 完整字段
│   ├── /auth          ✅ 认证相关
│   ├── /bookmarks     ✅ 书签管理
│   ├── /tags          ✅ 标签管理
│   ├── /tab-groups    ✅ 标签页组（完整字段）
│   ├── /settings      ✅ 设置管理
│   ├── /preferences   ✅ 用户偏好
│   ├── /export        ✅ 导出功能
│   └── /import        ✅ 导入功能
│
├── /tab/*             ✅ 浏览器扩展 API (API Key 或 JWT) - 完整字段
│   ├── /bookmarks     ✅ 书签管理
│   ├── /tags          ✅ 标签管理
│   ├── /tab-groups    ✅ 标签页组
│   ├── /me            ✅ 用户信息
│   ├── /search        ✅ 全局搜索
│   └── /statistics    ✅ 统计信息
│
├── /public/*          ✅ 公开分享（无需认证）
├── /share/*           ✅ 分享链接（Token）
└── /snapshot-images/* ✅ 快照图片
```

### 优势

1. **一致性** - 所有 API 字段完全一致
2. **清晰性** - 路径规范，易于理解
3. **可维护性** - 代码结构清晰，易于维护
4. **向后兼容** - 分阶段迁移，不影响现有功能

---

## ✅ 验证清单

### Phase 1 验证
- [ ] `/api/v1/tab-groups` GET 返回完整字段
- [ ] `/api/v1/tab-groups` POST 创建成功
- [ ] `/api/v1/tab-groups/:id` PATCH 支持所有字段
- [ ] 拖拽功能正常
- [ ] 锁定/解锁功能正常
- [ ] 文件夹创建正常

### Phase 2 验证
- [ ] 浏览器扩展用户信息显示正常
- [ ] 浏览器扩展搜索功能正常
- [ ] 浏览器扩展统计信息正常

### Phase 3 验证
- [ ] 旧 API 文件已删除
- [ ] 生产环境运行正常
- [ ] 无 404 错误
- [ ] API 文档已更新

---

## 📝 注意事项

### 1. 数据库查询
确保所有 SQL 查询都包含完整字段：
```sql
SELECT id, user_id, title, color, tags, parent_id, is_folder, 
       is_deleted, deleted_at, position, created_at, updated_at
FROM tab_groups
WHERE user_id = ?
```

### 2. 类型定义
确保前端类型定义与后端一致：
```typescript
// tmarks/src/lib/types.ts
export interface TabGroup {
  id: string
  user_id: string
  title: string
  color: string | null
  tags: string[] | null
  parent_id: string | null
  is_folder: number
  is_deleted: number
  deleted_at: string | null
  position: number
  created_at: string
  updated_at: string
  items?: TabGroupItem[]
  item_count?: number
  children?: TabGroup[]
}
```

### 3. 部署顺序
1. 先部署后端（完善 API）
2. 再部署前端（使用新 API）
3. 最后清理旧 API

---

## 🚀 开始执行

准备好了吗？让我们从 Phase 1 开始！

**下一步**: 修改 `/api/v1/tab-groups/[id].ts` 和 `/api/v1/tab-groups/index.ts`
