# TMarks API 架构说明

## 📋 当前 API 结构

### 1️⃣ `/api/v1/*` - Web 前端 API
**认证方式**: JWT Token (Bearer)  
**使用者**: Web 应用前端  
**配置**: `VITE_API_URL=/api/v1`

#### 端点列表
- `GET /api/v1/tab-groups` - 获取标签页组列表
- `POST /api/v1/tab-groups` - 创建标签页组
- `GET /api/v1/tab-groups/:id` - 获取单个标签页组
- `PATCH /api/v1/tab-groups/:id` - 更新标签页组 ✅ **已支持 parent_id 和 position**
- `DELETE /api/v1/tab-groups/:id` - 删除标签页组
- `PATCH /api/v1/tab-groups/items/:id` - 更新标签页项
- `DELETE /api/v1/tab-groups/items/:id` - 删除标签页项
- `POST /api/v1/tab-groups/items/:id/move` - 移动标签页项

### 2️⃣ `/api/tab/*` - 浏览器扩展 API
**认证方式**: API Key (X-API-Key header) 或 JWT Token (Bearer)  
**使用者**: 浏览器扩展  
**特点**: 双重认证，支持权限控制

#### 端点列表
- `GET /api/tab/tab-groups` - 获取标签页组列表
- `POST /api/tab/tab-groups` - 创建标签页组
- `GET /api/tab/tab-groups/:id` - 获取单个标签页组
- `PATCH /api/tab/tab-groups/:id` - 更新标签页组
- `DELETE /api/tab/tab-groups/:id` - 删除标签页组
- `PATCH /api/tab/tab-groups/items/:id` - 更新标签页项
- `DELETE /api/tab/tab-groups/items/:id` - 删除标签页项
- `POST /api/tab/tab-groups/items/:id/move` - 移动标签页项

### 3️⃣ `/api/tab-groups/*` - 旧的内部 API（待废弃）
**认证方式**: JWT Token (Bearer)  
**状态**: ⚠️ 历史遗留，建议废弃  
**问题**: 与 `/api/v1/tab-groups` 功能重复

## 🔧 拖拽功能修复

### 问题原因
Web 前端使用 `/api/v1/tab-groups/:id` 更新分组时，发送了 `parent_id` 和 `position` 字段，但该接口之前只支持 `title` 字段，导致返回 400 错误。

### 修复内容
修改 `/api/v1/tab-groups/[id].ts`：

```typescript
// 修复前
interface UpdateTabGroupRequest {
  title?: string
}

// 修复后
interface UpdateTabGroupRequest {
  title?: string
  parent_id?: string | null
  position?: number
}
```

并在 PATCH 处理逻辑中添加对这两个字段的支持：

```typescript
if (body.parent_id !== undefined) {
  updates.push('parent_id = ?')
  params.push(body.parent_id)
}

if (body.position !== undefined) {
  updates.push('position = ?')
  params.push(body.position)
}
```

## 📊 API 对比

| 功能 | `/api/v1/tab-groups` | `/api/tab/tab-groups` | `/api/tab-groups` |
|------|---------------------|----------------------|-------------------|
| 认证方式 | JWT Token | API Key 或 JWT | JWT Token |
| 使用者 | Web 前端 | 浏览器扩展 | 历史遗留 |
| 支持 title | ✅ | ✅ | ✅ |
| 支持 parent_id | ✅ (已修复) | ✅ | ✅ |
| 支持 position | ✅ (已修复) | ✅ | ✅ |
| 支持 color | ❌ | ✅ | ✅ |
| 支持 tags | ❌ | ✅ | ✅ |
| 权限控制 | ❌ | ✅ | ❌ |
| 速率限制 | ❌ | ✅ | ❌ |

## 🎯 使用建议

### Web 前端
```typescript
// 使用 apiClient (baseURL = /api/v1)
import { apiClient } from '@/lib/api-client'

// 更新标签页组（支持拖拽）
await apiClient.patch(`/tab-groups/${id}`, {
  parent_id: newParentId,
  position: newPosition
})
```

### 浏览器扩展
```typescript
// 使用 TMarks Client (baseURL = /api)
import { createTMarksClient } from '@/lib/api/tmarks'

const client = createTMarksClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://tmarks.example.com/api'
})

// 使用 /api/tab/tab-groups
await client.tabGroups.updateTabGroup(id, {
  parent_id: newParentId,
  position: newPosition
})
```

## 🗑️ 待废弃的 API

### `/api/tab-groups/*`
**原因**:
1. 与 `/api/v1/tab-groups` 功能重复
2. 没有权限控制和速率限制
3. 不符合当前的 API 设计规范

**迁移计划**:
1. ✅ 确保 `/api/v1/tab-groups` 功能完整（已完成）
2. ⏳ 检查是否有代码仍在使用 `/api/tab-groups`
3. ⏳ 将所有引用迁移到 `/api/v1/tab-groups`
4. ⏳ 删除 `/api/tab-groups` 相关文件

## 🔍 检查清单

- [x] `/api/v1/tab-groups/:id` 支持 `parent_id` 和 `position`
- [ ] 检查前端代码是否有直接使用 `/api/tab-groups` 的地方
- [ ] 检查浏览器扩展是否正确使用 `/api/tab/tab-groups`
- [ ] 确认所有拖拽功能正常工作
- [ ] 考虑删除 `/api/tab-groups` 目录

## 📝 部署说明

修复后需要重新部署后端：

```bash
cd tmarks
npm run deploy
# 或
wrangler pages deploy
```

部署完成后，拖拽功能应该能正常工作。
