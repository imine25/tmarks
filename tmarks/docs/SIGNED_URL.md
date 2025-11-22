# 签名 URL 方案

## 概述

为了安全地分享快照等资源，我们实现了类似 AWS S3 Presigned URL 的签名 URL 机制。

## 方案对比

### 旧方案：JWT Token 查询参数
```
/api/v1/bookmarks/{id}/snapshots/{snapshotId}?token=eyJhbGc...
```

**问题：**
- ❌ URL 过长（JWT token 通常 200+ 字符）
- ❌ Token 可能在日志、浏览器历史中泄露
- ❌ Token 有效期长（通常 30 天），安全风险高
- ❌ Token 可以访问所有用户资源

### 新方案：签名 URL
```
/api/v1/bookmarks/{id}/snapshots/{snapshotId}/view?sig=abc123&exp=1234567890&u=user-id
```

**优点：**
- ✅ URL 简短美观（签名 64 字符）
- ✅ 可以设置短期有效期（默认 24 小时）
- ✅ 签名只对特定资源有效
- ✅ 即使泄露也影响有限
- ✅ 符合大厂最佳实践

## 技术实现

### 签名算法

使用 HMAC-SHA256 算法：

```
signature = HMAC-SHA256(
  message: "{userId}:{resourceId}:{expires}:{action}",
  secret: JWT_SECRET
)
```

### URL 参数

| 参数 | 说明 | 示例 |
|------|------|------|
| `sig` | 签名字符串（64 字符 hex） | `a1b2c3d4...` |
| `exp` | 过期时间（Unix timestamp） | `1732291200` |
| `u` | 用户 ID | `22accdd...` |
| `a` | 操作类型（可选） | `view` |

### 验证流程

1. 提取 URL 参数：`sig`, `exp`, `u`, `a`
2. 检查是否过期：`exp > now`
3. 重新计算签名：`expected_sig = HMAC-SHA256(...)`
4. 比对签名：`sig === expected_sig`

## API 使用

### 1. 获取快照列表（返回签名 URL）

**请求：**
```http
GET /api/v1/bookmarks/{id}/snapshots
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
        "view_url": "https://tmarks.insightai.top/api/v1/bookmarks/{id}/snapshots/{snapshotId}/view?sig=a1b2c3&exp=1732291200&u=22accdd"
      }
    ]
  }
}
```

### 2. 查看快照（使用签名 URL）

**请求：**
```http
GET /api/v1/bookmarks/{id}/snapshots/{snapshotId}/view?sig=...&exp=...&u=...
```

**响应：**
```html
<!DOCTYPE html>
<html>
  <!-- 快照 HTML 内容 -->
</html>
```

## 安全特性

### 1. 时间限制
- 默认有效期：24 小时
- 可自定义：1 小时 ~ 7 天
- 过期后自动失效

### 2. 资源隔离
- 签名绑定特定资源 ID
- 无法用于访问其他资源
- 用户 ID 验证

### 3. 操作限制
- 可指定操作类型（view, download）
- 防止权限提升

### 4. 防篡改
- HMAC-SHA256 签名
- 任何参数修改都会导致验证失败

## 与大厂方案对比

### AWS S3 Presigned URL
```
https://bucket.s3.amazonaws.com/object?
  X-Amz-Algorithm=AWS4-HMAC-SHA256&
  X-Amz-Credential=...&
  X-Amz-Date=20231122T120000Z&
  X-Amz-Expires=3600&
  X-Amz-Signature=...
```

### 阿里云 OSS 签名 URL
```
https://bucket.oss-cn-hangzhou.aliyuncs.com/object?
  OSSAccessKeyId=...&
  Expires=1234567890&
  Signature=...
```

### TMarks 签名 URL（简化版）
```
https://tmarks.insightai.top/api/v1/bookmarks/{id}/snapshots/{snapshotId}/view?
  sig=...&
  exp=1234567890&
  u=...
```

**我们的方案更简洁，但保留了核心安全特性。**

## 迁移指南

### 前端代码修改

**旧代码：**
```typescript
const url = `/api/v1/bookmarks/${id}/snapshots/${snapshotId}?token=${jwtToken}`
```

**新代码：**
```typescript
// 从 API 获取快照列表时，已经包含 view_url
const snapshots = await getSnapshots(bookmarkId)
const url = snapshots[0].view_url // 直接使用签名 URL
```

### 兼容性

- ✅ 旧的 JWT token 方式仍然支持（向后兼容）
- ✅ 新的签名 URL 方式优先推荐
- ⚠️ 建议逐步迁移到新方案

## 最佳实践

1. **有效期设置**
   - 临时分享：1-4 小时
   - 邮件链接：24 小时
   - 长期访问：使用 JWT token

2. **URL 分享**
   - 避免在公开场合分享
   - 使用短链接服务
   - 定期更新签名

3. **监控告警**
   - 记录签名验证失败
   - 监控异常访问模式
   - 设置访问频率限制

## 参考资料

- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [阿里云 OSS 签名 URL](https://help.aliyun.com/document_detail/31952.html)
- [HMAC-SHA256 算法](https://en.wikipedia.org/wiki/HMAC)
