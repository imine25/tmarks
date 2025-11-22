# 快照访问方式

## 概述

快照现在使用**签名 URL**方式访问，提供更好的安全性和更短的 URL。

## 使用方式

### 1. 获取快照列表

**请求：**
```http
GET /api/v1/bookmarks/{bookmarkId}/snapshots
Authorization: Bearer {jwt_token}
```

**响应：**
```json
{
  "data": {
    "snapshots": [
      {
        "id": "c4NkVuil1NlyMJQBjC0cd",
        "version": 1,
        "file_size": 1024000,
        "content_hash": "abc123...",
        "snapshot_title": "React 官方文档",
        "is_latest": true,
        "created_at": "2024-01-20T10:30:00Z",
        "view_url": "https://tmarks.insightai.top/api/v1/bookmarks/{bookmarkId}/snapshots/{snapshotId}/view?sig=a1b2c3&exp=1732291200&u=user-id"
      }
    ],
    "total": 1
  }
}
```

### 2. 查看快照

直接使用返回的 `view_url`，无需额外认证：

```typescript
// 前端代码示例
const snapshots = await getSnapshots(bookmarkId)
const viewUrl = snapshots[0].view_url

// 在新窗口打开
window.open(viewUrl, '_blank')

// 或在 iframe 中显示
<iframe src={viewUrl} />
```

## 签名 URL 参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `sig` | 签名字符串（64 字符） | `a1b2c3d4...` |
| `exp` | 过期时间（Unix timestamp） | `1732291200` |
| `u` | 用户 ID | `22accdd...` |
| `a` | 操作类型（可选） | `view` |

## 安全特性

### 1. 时间限制
- 默认有效期：**24 小时**
- 过期后自动失效
- 需要重新获取快照列表以获得新的签名 URL

### 2. 资源隔离
- 签名绑定特定快照 ID
- 无法用于访问其他快照
- 用户 ID 验证

### 3. 防篡改
- HMAC-SHA256 签名
- 任何参数修改都会导致验证失败

## API 端点

### 旧端点（已废弃）❌
```
GET /api/v1/bookmarks/{id}/snapshots/{snapshotId}?token={jwt_token}
```
**问题：**
- URL 过长
- Token 可能泄露
- 不再支持

### 新端点（推荐）✅
```
GET /api/v1/bookmarks/{id}/snapshots/{snapshotId}/view?sig=xxx&exp=xxx&u=xxx
```
**优点：**
- URL 简短
- 有效期可控
- 更安全

## 错误处理

### 签名过期
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "URL has expired"
  }
}
```
**解决方法：** 重新获取快照列表以获得新的签名 URL

### 签名无效
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid signature"
  }
}
```
**原因：** URL 参数被篡改或签名错误

### 快照不存在
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Snapshot not found"
  }
}
```

## 前端集成示例

### React 组件
```typescript
import { useState, useEffect } from 'react'

function SnapshotViewer({ bookmarkId }: { bookmarkId: string }) {
  const [snapshots, setSnapshots] = useState([])
  
  useEffect(() => {
    async function loadSnapshots() {
      const response = await fetch(
        `/api/v1/bookmarks/${bookmarkId}/snapshots`,
        {
          headers: {
            'Authorization': `Bearer ${getAccessToken()}`
          }
        }
      )
      const data = await response.json()
      setSnapshots(data.data.snapshots)
    }
    
    loadSnapshots()
  }, [bookmarkId])
  
  return (
    <div>
      {snapshots.map(snapshot => (
        <div key={snapshot.id}>
          <h3>{snapshot.snapshot_title}</h3>
          <a 
            href={snapshot.view_url} 
            target="_blank"
            rel="noopener noreferrer"
          >
            查看快照
          </a>
        </div>
      ))}
    </div>
  )
}
```

### 在 iframe 中显示
```typescript
function SnapshotPreview({ viewUrl }: { viewUrl: string }) {
  return (
    <iframe
      src={viewUrl}
      style={{ width: '100%', height: '600px', border: 'none' }}
      sandbox="allow-same-origin allow-scripts"
      title="快照预览"
    />
  )
}
```

## 注意事项

1. **不要缓存签名 URL** - 24 小时后会过期
2. **不要分享签名 URL** - 包含用户信息，可能泄露隐私
3. **使用 HTTPS** - 确保传输安全
4. **定期刷新** - 如果需要长期访问，定期重新获取签名 URL

## 迁移指南

### 从旧方式迁移

**旧代码：**
```typescript
const token = getAccessToken()
const url = `/api/v1/bookmarks/${bookmarkId}/snapshots/${snapshotId}?token=${token}`
window.open(url)
```

**新代码：**
```typescript
// 1. 获取快照列表（包含签名 URL）
const response = await fetch(`/api/v1/bookmarks/${bookmarkId}/snapshots`, {
  headers: { 'Authorization': `Bearer ${getAccessToken()}` }
})
const data = await response.json()

// 2. 直接使用 view_url
const viewUrl = data.data.snapshots[0].view_url
window.open(viewUrl)
```

## 总结

✅ **新方式的优势：**
- 更短的 URL
- 更好的安全性
- 可控的有效期
- 符合大厂最佳实践

❌ **旧方式已废弃：**
- 不再支持 `?token=xxx` 参数
- 请尽快迁移到新方式
