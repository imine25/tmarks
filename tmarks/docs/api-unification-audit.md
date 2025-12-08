# TMarks API 统一性全面审计报告

## 📊 当前 API 架构总览

### 🎯 三层 API 结构

```
/api
├── /v1                    ✅ Web 前端 API (JWT Token)
├── /tab                   ✅ 浏览器扩展 API (API Key 或 JWT)
├── /tab-groups            ⚠️ 旧的内部 API (JWT Token) - 待废弃
├── /tags                  ⚠️ 旧的内部 API (JWT Token) - 待废弃
├── /me                    ⚠️ 旧的内部 API (JWT Token) - 待废弃
├── /search                ⚠️ 旧的内部 API (JWT Token) - 待废弃
├── /public                ✅ 公开分享 API (无需认证)
├── /share                 ✅ 分享链接 API (Token)
├── /snapshot-images       ✅ 快照图片 API
└── /statistics            ⚠️ 旧的内部 API (JWT Token) - 待废弃
```

---

## 🔍 详细对比分析

### 1. Tab Groups API

#### `/api/v1/tab-groups` ✅ 推荐使用
**路径**: `tmarks/functions/api/v1/tab-groups/`
**认证**: JWT Token only
**使用者**: Web 前端
**状态**: ✅ 主要 API

**端点**:
- `GET /api/v1/tab-groups` - 获取列表
- `POST /api/v1/tab-groups` - 创建
- `GET /api/v1/tab-groups/:id` - 获取详情
- `PATCH /api/v1/tab-groups/:id` - 更新 ✅ **已支持 parent_id, position**
- `DELETE /api/v1/tab-groups/:id` - 删除

**TabGroupRow 字段**:
```typescript
interface TabGroupRow {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
  // ❌ 缺少: color, tags, parent_id, is_folder, is_deleted, position
}
```

**UpdateTabGroupRequest 字段**:
```typescript
interface UpdateTabGroupRequest {
  title?: string
  parent_id?: string | null    // ✅ 已添加
  position?: number             // ✅ 已添加
  // ❌ 缺少: color, tags
}
```

---

#### `/api/tab/tab-groups` ✅ 推荐使用
**路径**: `tmarks/functions/api/tab/tab-groups/`
**认证**: API Key 或 JWT Token (双重认证)
**使用者**: 浏览器扩展
**状态**: ✅ 主要 API

**端点**:
- `GET /api/tab/tab-groups` - 获取列表
- `POST /api/tab/tab-groups` - 创建
- `GET /api/tab/tab-groups/:id` - 获取详情
- `PATCH /api/tab/tab-groups/:id` - 更新
- `DELETE /api/tab/tab-groups/:id` - 删除
- `GET /api/tab/tab-groups/trash` - 回收站

**TabGroupRow 字段**:
```typescript
interface TabGroupRow {
  id: string
  user_id: string
  title: string
  color: string | null          // ✅ 完整
  tags: string | null           // ✅ 完整
  parent_id: string | null      // ✅ 完整
  is_folder: number             // ✅ 完整
  is_deleted: number            // ✅ 完整
  deleted_at: string | null     // ✅ 完整
  position: number              // ✅ 完整
  created_at: string
  updated_at: string
}
```

**UpdateTabGroupRequest 字段**:
```typescript
interface UpdateTabGroupRequest {
  title?: string
  color?: string | null         // ✅ 完整
  tags?: string[] | null        // ✅ 完整
  parent_id?: string | null     // ✅ 完整
  position?: number             // ✅ 完整
}
```

---

#### `/api/tab-groups` ⚠️ 待废弃
**路径**: `tmarks/functions/api/tab-groups/`
**认证**: JWT Token only
**使用者**: 历史遗留
**状态**: ⚠️ 待废弃

**问题**:
1. 与 `/api/v1/tab-groups` 功能重复
2. 没有权限控制和速率限制
3. 不符合当前的 API 设计规范（应该在 v1 或 tab 下）

**TabGroupRow 字段**: 与 `/api/tab/tab-groups` 相同（完整）

---

### 2. Tags API

#### `/api/v1/tags` ✅ 推荐使用
**路径**: `tmarks/functions/api/v1/tags/`
**认证**: JWT Token only
**使用者**: Web 前端
**状态**: ✅ 主要 API

---

#### `/api/tab/tags` ✅ 推荐使用
**路径**: `tmarks/functions/api/tab/tags/`
**认证**: API Key 或 JWT Token
**使用者**: 浏览器扩展
**状态**: ✅ 主要 API

---

#### `/api/tags` ⚠️ 待废弃
**路径**: `tmarks/functions/api/tags/`
**认证**: JWT Token only
**使用者**: 历史遗留
**状态**: ⚠️ 待废弃

---

### 3. Bookmarks API

#### `/api/v1/bookmarks` ✅ 推荐使用
**路径**: `tmarks/functions/api/v1/bookmarks/`
**认证**: JWT Token only
**使用者**: Web 前端
**状态**: ✅ 主要 API

---

#### `/api/tab/bookmarks` ✅ 推荐使用
**路径**: `tmarks/functions/api/tab/bookmarks/`
**认证**: API Key 或 JWT Token
**使用者**: 浏览器扩展
**状态**: ✅ 主要 API

---

#### `/api/bookmarks` ❌ 已废弃
**路径**: `tmarks/functions/api/_deprecated_backup/bookmarks/`
**状态**: ❌ 已移至 _deprecated_backup

---

### 4. User/Me API

#### `/api/v1/me` ❌ 不存在
**状态**: ❌ 未实现

---

#### `/api/tab/me` ✅ 存在
**路径**: `tmarks/functions/api/tab/me.ts`
**认证**: API Key 或 JWT Token
**使用者**: 浏览器扩展
**状态**: ✅ 可用

---

#### `/api/me` ⚠️ 待废弃
**路径**: `tmarks/functions/api/me.ts`
**认证**: JWT Token only
**使用者**: 历史遗留
**状态**: ⚠️ 待废弃

---

### 5. Search API

#### `/api/v1/search` ❌ 不存在
**状态**: ❌ 未实现

---

#### `/api/tab/search` ✅ 存在
**路径**: `tmarks/functions/api/tab/search.ts`
**认证**: API Key 或 JWT Token
**使用者**: 浏览器扩展
**状态**: ✅ 可用

---

#### `/api/search` ⚠️ 待废弃
**路径**: `tmarks/functions/api/search.ts`
**认证**: JWT Token only
**使用者**: 历史遗留
**状态**: ⚠️ 待废弃

---

### 6. Statistics API

#### `/api/v1/statistics` ❌ 不存在
**状态**: ❌ 未实现

---

#### `/api/tab/statistics` ✅ 存在
**路径**: `tmarks/functions/api/tab/statistics/`
**认证**: API Key 或 JWT Token
**使用者**: 浏览器扩展
**状态**: ✅ 可用

---

#### `/api/statistics` ⚠️ 待废弃
**路径**: `tmarks/functions/api/statistics/`
**认证**: JWT Token only
**使用者**: 历史遗留
**状态**: ⚠️ 待废弃

---

## 🚨 不一致性问题汇总

### 问题 1: `/api/v1/tab-groups` 字段不完整
**影响**: Web 前端无法使用完整功能

**缺少字段**:
- `color` - 分组颜色
- `tags` - 分组标签（用于锁定等状态）
- `is_folder` - 是否为文件夹
- `is_deleted` - 软删除标记
- `deleted_at` - 删除时间

**TabGroupRow 对比**:
```typescript
// /api/v1/tab-groups - 不完整 ❌
interface TabGroupRow {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

// /api/tab/tab-groups - 完整 ✅
interface TabGroupRow {
  id: string
  user_id: string
  title: string
  color: string | null
  tags: string | null
  parent_id: string | null
  is_folder: number
  is_deleted: number
  deleted_at: string | null
  position: number
  created_at: string
  updated_at: string
}
```

**UpdateTabGroupRequest 对比**:
```typescript
// /api/v1/tab-groups - 部分支持 ⚠️
interface UpdateTabGroupRequest {
  title?: string
  parent_id?: string | null    // ✅ 已修复
  position?: number             // ✅ 已修复
}

// /api/tab/tab-groups - 完整 ✅
interface UpdateTabGroupRequest {
  title?: string
  color?: string | null
  tags?: string[] | null
  parent_id?: string | null
  position?: number
}
```

---

### 问题 2: 旧 API 路径未清理
**影响**: 代码混乱，维护困难

**待废弃的路径**:
- `/api/tab-groups/*` - 与 `/api/v1/tab-groups` 重复
- `/api/tags/*` - 与 `/api/v1/tags` 重复
- `/api/me` - 与 `/api/tab/me` 重复
- `/api/search` - 与 `/api/tab/search` 重复
- `/api/statistics` - 与 `/api/tab/statistics` 重复

---

### 问题 3: `/api/v1` 缺少部分端点
**影响**: Web 前端功能不完整

**缺少的端点**:
- `/api/v1/me` - 用户信息
- `/api/v1/search` - 全局搜索
- `/api/v1/statistics` - 统计信息

**当前状态**:
- Web 前端可能需要直接调用 `/api/me`、`/api/search` 等旧 API
- 不符合统一的 API 设计规范

---

## 📋 统一化建议

### 方案 A: 完善 `/api/v1` (推荐)

#### 1. 完善 `/api/v1/tab-groups`
```typescript
// 修改 tmarks/functions/api/v1/tab-groups/[id].ts

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
```

#### 2. 添加缺失的端点
- 创建 `/api/v1/me.ts`
- 创建 `/api/v1/search.ts`
- 创建 `/api/v1/statistics/`

#### 3. 废弃旧 API
- 删除 `/api/tab-groups/`
- 删除 `/api/tags/`
- 删除 `/api/me.ts`
- 删除 `/api/search.ts`
- 删除 `/api/statistics/`

---

### 方案 B: 保持现状 + 文档说明

#### 优点
- 不需要大规模重构
- 向后兼容

#### 缺点
- API 不统一
- 维护困难
- 新开发者容易混淆

---

## 🎯 推荐的统一化路线图

### Phase 1: 完善 `/api/v1` (高优先级)
- [x] `/api/v1/tab-groups/:id` 支持 `parent_id` 和 `position` ✅ 已完成
- [ ] `/api/v1/tab-groups/:id` 支持 `color` 和 `tags`
- [ ] `/api/v1/tab-groups` 返回完整的 TabGroupRow
- [ ] 创建 `/api/v1/me`
- [ ] 创建 `/api/v1/search`
- [ ] 创建 `/api/v1/statistics`

### Phase 2: 迁移前端代码 (中优先级)
- [ ] 检查前端是否使用旧 API
- [ ] 将所有旧 API 调用迁移到 `/api/v1`
- [ ] 更新文档和注释

### Phase 3: 清理旧 API (低优先级)
- [ ] 标记旧 API 为 deprecated
- [ ] 添加警告日志
- [ ] 设置废弃时间表
- [ ] 删除旧 API 文件

---

## 📊 API 使用情况检查

### Web 前端 (tmarks/src)
```bash
# 检查是否使用旧 API
grep -r "api/tab-groups" tmarks/src/
grep -r "api/tags" tmarks/src/
grep -r "api/me" tmarks/src/
grep -r "api/search" tmarks/src/
```

**结果**: ✅ 未发现直接使用旧 API

### 浏览器扩展 (tab/src)
```bash
# 检查 API 使用情况
grep -r "/v1/" tab/src/
grep -r "/tab/" tab/src/
```

**结果**: ✅ 正确使用 `/api/tab/*` 和 `/api/v1/*`

---

## 🔧 立即修复建议

### 1. 完善 `/api/v1/tab-groups/[id].ts` (高优先级)

**当前问题**: TabGroupRow 字段不完整，导致前端无法获取完整数据

**修复方案**:
```typescript
// 修改 tmarks/functions/api/v1/tab-groups/[id].ts

interface TabGroupRow {
  id: string
  user_id: string
  title: string
  color: string | null
  tags: string | null
  parent_id: string | null
  is_folder: number
  is_deleted: number
  deleted_at: string | null
  position: number
  created_at: string
  updated_at: string
}

interface UpdateTabGroupRequest {
  title?: string
  color?: string | null
  tags?: string[] | null
  parent_id?: string | null
  position?: number
}

// 在 PATCH 处理中添加 color 和 tags 的更新逻辑
if (body.color !== undefined) {
  updates.push('color = ?')
  params.push(body.color)
}

if (body.tags !== undefined) {
  updates.push('tags = ?')
  params.push(body.tags ? JSON.stringify(body.tags) : null)
}
```

### 2. 添加 `/api/v1/me` (中优先级)

**创建文件**: `tmarks/functions/api/v1/me.ts`

```typescript
import type { PagesFunction } from '@cloudflare/workers-types'
import type { Env, RouteParams } from '../../lib/types'
import { success, internalError } from '../../lib/response'
import { requireAuth, AuthContext } from '../../middleware/auth'

export const onRequestGet: PagesFunction<Env, RouteParams, AuthContext>[] = [
  requireAuth,
  async (context) => {
    const userId = context.data.user_id

    try {
      const user = await context.env.DB.prepare(
        'SELECT id, username, email, created_at FROM users WHERE id = ?'
      )
        .bind(userId)
        .first()

      if (!user) {
        return internalError('User not found')
      }

      return success({ user })
    } catch (error) {
      console.error('Get user error:', error)
      return internalError('Failed to get user')
    }
  },
]
```

---

## 📝 总结

### 当前状态
- ✅ `/api/v1/*` - Web 前端主要 API（部分字段不完整）
- ✅ `/api/tab/*` - 浏览器扩展主要 API（完整）
- ⚠️ `/api/tab-groups/*` - 旧 API，待废弃
- ⚠️ `/api/tags/*` - 旧 API，待废弃
- ⚠️ `/api/me` - 旧 API，待废弃
- ⚠️ `/api/search` - 旧 API，待废弃
- ⚠️ `/api/statistics` - 旧 API，待废弃

### 关键问题
1. ❌ `/api/v1/tab-groups` 字段不完整
2. ❌ `/api/v1` 缺少 me、search、statistics 端点
3. ⚠️ 旧 API 路径未清理

### 推荐行动
1. **立即**: 完善 `/api/v1/tab-groups` 的字段支持
2. **短期**: 添加 `/api/v1/me`、`/api/v1/search`、`/api/v1/statistics`
3. **中期**: 迁移所有旧 API 调用
4. **长期**: 删除旧 API 文件
