# TMarks 安全审查报告

## 审查日期
2024-11-22

## 审查范围
- SQL 存储安全
- API 权限验证
- ID 生成和鉴权
- 数据隔离

---

## ✅ 安全优势

### 1. 数据库设计 - 安全 ✅

#### 用户隔离
所有核心表都包含 `user_id` 字段，确保数据隔离：

```sql
-- ✅ 书签表
CREATE TABLE bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- 用户隔离
  ...
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ✅ 标签表
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- 用户隔离
  ...
);

-- ✅ 快照表
CREATE TABLE bookmark_snapshots (
  id TEXT PRIMARY KEY,
  bookmark_id TEXT NOT NULL,
  user_id TEXT NOT NULL,  -- 双重验证
  ...
);
```

#### 外键约束
使用 `ON DELETE CASCADE` 确保数据一致性：
- 删除用户 → 自动删除所有相关数据
- 删除书签 → 自动删除快照和标签关联
- 防止孤立数据

### 2. API 权限验证 - 安全 ✅

#### 所有 API 都验证用户权限

**示例 1：书签更新**
```typescript
// ✅ 正确：验证书签属于当前用户
const bookmark = await db.prepare(
  'SELECT * FROM bookmarks WHERE id = ? AND user_id = ? AND deleted_at IS NULL'
).bind(bookmarkId, userId).first()

if (!bookmark) {
  return notFound('Bookmark not found')
}
```

**示例 2：快照访问**
```typescript
// ✅ 正确：验证快照属于当前用户
const snapshot = await db.prepare(
  `SELECT s.* FROM bookmark_snapshots s
   JOIN bookmarks b ON s.bookmark_id = b.id
   WHERE s.id = ? AND s.bookmark_id = ? AND s.user_id = ?`
).bind(snapshotId, bookmarkId, userId).first()
```

**示例 3：标签页组**
```typescript
// ✅ 正确：验证标签页组属于当前用户
const group = await db.prepare(
  'SELECT * FROM tab_groups WHERE id = ? AND user_id = ?'
).bind(groupId, userId).first()
```

### 3. ID 生成 - 安全 ✅

#### UUID v4（数据库主键）
```typescript
// ✅ 使用 crypto.randomUUID()
const userId = generateUUID()
// 550e8400-e29b-41d4-a716-446655440000

// 128 位随机性，无法预测
// 碰撞概率：~1% 在 85 年内生成 1000 个/秒
```

#### NanoID（公开 URL）
```typescript
// ✅ 使用 crypto.getRandomValues()
const snapshotId = generateNanoId()
// c4NkVuil1NlyMJQBjC0cd

// ~126 位随机性，无法预测
// 碰撞概率：~1% 在 1 亿年内生成 1000 个/秒
```

**结论：** 所有 ID 都使用密码学级别的随机数生成器，无法被猜测或枚举。

### 4. 签名 URL - 安全 ✅

#### HMAC-SHA256 签名
```typescript
// ✅ 签名绑定特定资源
signature = HMAC-SHA256(
  message: "{userId}:{resourceId}:{expires}:{action}",
  secret: JWT_SECRET
)

// 特性：
// - 时间限制（24 小时）
// - 资源隔离（只能访问特定快照）
// - 防篡改（任何参数修改都会失效）
```

---

## ⚠️ 潜在风险和建议

### 1. 快照访问 - 中等风险 ⚠️

#### 当前实现
```typescript
// 快照查看 API
const snapshot = await db.prepare(
  `SELECT s.* FROM bookmark_snapshots s
   JOIN bookmarks b ON s.bookmark_id = b.id
   WHERE s.id = ? AND s.bookmark_id = ? AND s.user_id = ?`
).bind(snapshotId, bookmarkId, userId).first()
```

#### 风险分析
- ✅ **已验证**：`user_id` 确保只能访问自己的快照
- ✅ **已验证**：`bookmark_id` 确保快照属于指定书签
- ✅ **签名保护**：URL 包含签名，防止篡改
- ⚠️ **时间窗口**：签名有效期内（24 小时）可以访问

#### 建议
**当前实现已经足够安全**，但如果需要更高安全性：

1. **缩短有效期**（可选）
   ```typescript
   // 从 24 小时改为 1 小时
   expiresIn: 1 * 3600
   ```

2. **添加访问日志**（推荐）
   ```typescript
   // 记录快照访问
   await db.prepare(
     'INSERT INTO snapshot_access_logs (snapshot_id, user_id, ip, accessed_at) VALUES (?, ?, ?, ?)'
   ).bind(snapshotId, userId, ip, now).run()
   ```

3. **添加访问次数限制**（可选）
   ```typescript
   // 限制每个签名 URL 只能访问 N 次
   const accessCount = await getAccessCount(signature)
   if (accessCount > 10) {
     return unauthorized('Access limit exceeded')
   }
   ```

### 2. 公开分享 - 低风险 ✅

#### 当前实现
```sql
-- 用户可以设置公开分享
CREATE TABLE users (
  public_share_enabled INTEGER NOT NULL DEFAULT 0,
  public_slug TEXT,
  ...
);
```

#### 风险分析
- ✅ **用户控制**：默认关闭，用户主动开启
- ✅ **唯一 slug**：防止冲突
- ✅ **可撤销**：用户可以随时关闭

#### 建议
**当前实现安全**，无需修改。

### 3. API Key 管理 - 安全 ✅

#### 当前实现
```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,  -- ✅ 存储哈希，不存储明文
  permissions TEXT NOT NULL,       -- ✅ 权限控制
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TEXT,                 -- ✅ 可设置过期时间
  ...
);
```

#### 安全特性
- ✅ 只存储哈希值，不存储明文
- ✅ 权限细粒度控制
- ✅ 可以随时撤销
- ✅ 记录使用日志

#### 建议
**当前实现安全**，符合最佳实践。

---

## 🔒 是否需要 UUID 鉴权？

### 问题
> 我们的 SQL 存储是否需要 UUID 进行鉴权？

### 答案：**不需要额外的 UUID 鉴权** ✅

### 理由

#### 1. 已有完善的权限验证
```typescript
// ✅ 每个 API 都验证 user_id
WHERE id = ? AND user_id = ?
```

即使攻击者知道资源 ID（UUID 或 NanoID），也无法访问，因为：
- 需要有效的 JWT token
- JWT token 包含 `user_id`
- SQL 查询验证 `user_id` 匹配

#### 2. ID 已经足够随机
- **UUID v4**: 128 位随机性，无法枚举
- **NanoID**: ~126 位随机性，无法枚举

攻击者无法通过猜测 ID 来访问资源。

#### 3. 多层防护
```
请求 → JWT 验证 → user_id 提取 → SQL 查询验证 → 返回数据
       ↓           ↓                ↓
     Layer 1     Layer 2          Layer 3
```

- **Layer 1**: JWT 签名验证
- **Layer 2**: Token 中的 user_id
- **Layer 3**: SQL 中的 user_id 验证

#### 4. 签名 URL 额外保护
对于快照等公开访问的资源：
```
请求 → 签名验证 → user_id 验证 → 资源 ID 验证 → 返回数据
```

### 结论
**当前的安全机制已经足够，不需要额外的 UUID 鉴权。**

---

## 🎯 安全最佳实践检查清单

### 已实现 ✅

- [x] **数据隔离**: 所有表都有 `user_id` 字段
- [x] **权限验证**: 所有 API 都验证 `user_id`
- [x] **密码安全**: 使用 PBKDF2 哈希（100,000 次迭代）
- [x] **Token 安全**: JWT 签名验证
- [x] **API Key 安全**: 只存储哈希值
- [x] **随机 ID**: 使用密码学级别的随机数生成器
- [x] **外键约束**: 防止孤立数据
- [x] **软删除**: 书签使用 `deleted_at` 字段
- [x] **输入验证**: 使用 `sanitizeString` 防止注入
- [x] **签名 URL**: HMAC-SHA256 签名保护

### 建议增强（可选）

- [ ] **访问日志**: 记录敏感操作（快照访问、API Key 使用）
- [ ] **速率限制**: 防止暴力破解（已有 API Key 速率限制）
- [ ] **审计日志**: 记录所有数据修改操作
- [ ] **IP 白名单**: API Key 可以限制 IP 范围
- [ ] **2FA**: 两步验证（高安全需求）

---

## 📊 安全评分

| 类别 | 评分 | 说明 |
|------|------|------|
| 数据隔离 | ⭐⭐⭐⭐⭐ | 完善的 user_id 验证 |
| 权限验证 | ⭐⭐⭐⭐⭐ | 所有 API 都验证权限 |
| 密码安全 | ⭐⭐⭐⭐⭐ | PBKDF2 + 100k 迭代 |
| Token 安全 | ⭐⭐⭐⭐⭐ | JWT + 签名 URL |
| ID 安全 | ⭐⭐⭐⭐⭐ | 密码学级别随机性 |
| 输入验证 | ⭐⭐⭐⭐⭐ | 完善的输入清理 |
| 审计日志 | ⭐⭐⭐☆☆ | 有基础日志，可增强 |

**总体评分: 4.7/5.0** ⭐⭐⭐⭐⭐

---

## 🚀 总结

### 当前安全状况
**TMarks 的安全实现已经非常完善**，符合行业最佳实践：

1. ✅ 完善的数据隔离
2. ✅ 严格的权限验证
3. ✅ 安全的 ID 生成
4. ✅ 多层防护机制

### 是否需要 UUID 鉴权？
**不需要。** 当前的 `user_id` 验证机制已经足够安全。

### 建议
1. **保持当前实现** - 已经很安全
2. **可选增强** - 添加访问日志和审计功能
3. **定期审查** - 每季度检查一次安全配置

---

## 📚 参考资料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
