# TMarks 配置变量总览

本文档列出了 TMarks 项目中所有需要配置的变量。

---

## 📋 配置变量清单

### 1. 前端环境变量（Vite）

**文件位置**：`.env.development` / `.env.production`

| 变量名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `VITE_API_URL` | string | 否 | `/api/v1` | API 基础 URL |
| `VITE_SKIP_AUTH` | boolean | 否 | `false` | 跳过登录验证（仅开发环境） |
| `VITE_PUBLIC_SHARE_URL` | string | 否 | `/api/public` | 公开分享 URL |

**当前配置状态**：
- ✅ `.env.development` - 已配置（开发环境）
- ✅ `.env.production` - 已配置（生产环境）
- ✅ `.env.example` - 已提供示例

---

### 2. 后端环境变量（Cloudflare Workers）

**文件位置**：`wrangler.toml` 的 `[vars]` 部分

| 变量名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `JWT_SECRET` | string | ✅ 是 | - | JWT 签名密钥（至少 32 字符） |
| `ENCRYPTION_KEY` | string | ✅ 是 | - | 数据加密密钥（32 字符） |
| `ENVIRONMENT` | string | 否 | `production` | 环境标识 |
| `JWT_ACCESS_TOKEN_EXPIRES_IN` | string | 否 | `365d` | 访问令牌过期时间 |
| `JWT_REFRESH_TOKEN_EXPIRES_IN` | string | 否 | `365d` | 刷新令牌过期时间 |
| `ALLOW_REGISTRATION` | boolean | 否 | `true` | 是否允许用户注册 |

**当前配置状态**：
- ✅ `wrangler.toml` - 已配置（生产环境）
- ✅ `.dev.vars.example` - 已提供示例（本地开发）
- ⚠️ `.dev.vars` - 需要手动创建（本地开发）

---

### 3. Cloudflare 资源绑定

**文件位置**：`wrangler.toml`

#### D1 数据库

| 配置项 | 当前值 | 说明 |
|--------|--------|------|
| `binding` | `DB` | 代码中的变量名 |
| `database_name` | `tmarks-prod-db` | 数据库名称 |
| `database_id` | `bdfa6639-e25d-4698-ad13-a4f95b8c4aa7` | 数据库 ID |

**状态**：✅ 已配置

#### KV 命名空间

| 绑定名 | ID | 用途 |
|--------|-----|------|
| `RATE_LIMIT_KV` | `1e2548bb595b4233ab1eb40e0a528539` | API 速率限制 |
| `PUBLIC_SHARE_KV` | `5ccc9cd9d3a24123accd3670b7fb3b7a` | 公开分享缓存 |

**状态**：✅ 已配置

---

### 4. Cloudflare 账户信息

**文件位置**：`.env.example`（仅供参考）

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账户 ID | Cloudflare Dashboard |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | Cloudflare Dashboard → API Tokens |
| `D1_DATABASE_ID` | D1 数据库 ID | 已在 wrangler.toml 中配置 |
| `KV_NAMESPACE_ID` | KV 命名空间 ID | 已在 wrangler.toml 中配置 |

**状态**：✅ 已在 wrangler.toml 中配置，无需额外设置

---

## 🔧 需要手动配置的变量

### 生产环境（推荐）

#### 1. Cloudflare Secrets（敏感信息）

**推荐方式**：使用 Cloudflare Secrets 存储敏感信息

```bash
# 设置 JWT_SECRET
wrangler secret put JWT_SECRET

# 设置 ENCRYPTION_KEY
wrangler secret put ENCRYPTION_KEY
```

**当前状态**：⚠️ 当前在 `wrangler.toml` 中明文配置，建议迁移到 Secrets

#### 2. 环境变量（非敏感信息）

已在 `wrangler.toml` 的 `[vars]` 部分配置：

```toml
[vars]
ALLOW_REGISTRATION = "true"
ENVIRONMENT = "production"
JWT_ACCESS_TOKEN_EXPIRES_IN = "365d"
JWT_REFRESH_TOKEN_EXPIRES_IN = "365d"
```

**状态**：✅ 已配置

---

## 📊 配置状态总结

### ✅ 已完成配置（无需操作）

1. **前端环境变量**
   - `.env.development` - 开发环境配置
   - `.env.production` - 生产环境配置

2. **Cloudflare 资源绑定**
   - D1 数据库绑定
   - KV 命名空间绑定

3. **后端环境变量**
   - `wrangler.toml` 中的基础配置

### ⚠️ 建议优化

1. **生产环境安全优化（推荐）**
   - 将 `JWT_SECRET` 迁移到 Cloudflare Secrets
   - 将 `ENCRYPTION_KEY` 迁移到 Cloudflare Secrets

---

## 🚀 快速部署指南

### 生产部署

```bash
# 1. 设置 Secrets（推荐）
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY

# 2. 运行数据库迁移
npm run db:migrate

# 3. 构建和部署
npm run build
npm run cf:deploy
```

---

## 🔒 安全建议

### 高优先级

1. ✅ **不要将 `.dev.vars` 提交到 Git**
   - 已在 `.gitignore` 中配置

2. ⚠️ **生产环境使用 Secrets**
   - 当前 `JWT_SECRET` 和 `ENCRYPTION_KEY` 在 `wrangler.toml` 中明文存储
   - 建议迁移到 Cloudflare Secrets

3. ✅ **定期更换密钥**
   - JWT_SECRET 建议每 6-12 个月更换一次

### 中优先级

1. ✅ **使用强密钥**
   - 至少 32 字符
   - 使用 `openssl rand -base64 32` 生成

2. ✅ **限制 API 访问**
   - 已实现 API Key 认证
   - 已实现速率限制

---

## 📝 配置变量使用情况

### 前端代码中使用的环境变量

| 文件 | 变量 | 用途 |
|------|------|------|
| `src/lib/api-client.ts` | `VITE_API_URL` | API 基础 URL |
| `src/lib/logger.ts` | `import.meta.env.DEV` | 开发模式检测 |
| `src/services/share.ts` | `VITE_PUBLIC_SHARE_URL` | 公开分享 URL |
| `src/components/auth/ProtectedRoute.tsx` | `VITE_SKIP_AUTH` | 跳过登录验证 |

### 后端代码中使用的环境变量

| 文件 | 变量 | 用途 |
|------|------|------|
| `functions/middleware/auth.ts` | `JWT_SECRET` | JWT 验证 |
| `functions/middleware/dual-auth.ts` | `JWT_SECRET`, `DB`, `RATE_LIMIT_KV` | 双重认证 |
| `functions/middleware/api-key-auth.ts` | `DB`, `RATE_LIMIT_KV` | API Key 认证 |
| `functions/api/v1/shared/cache.ts` | `PUBLIC_SHARE_KV` | 公开分享缓存 |

---

## 🎯 总结

### 配置变量总数：**11 个**

- **前端变量**：3 个（✅ 全部已配置）
- **后端变量**：6 个（✅ 全部已配置）
- **Cloudflare 资源**：2 个（✅ 全部已配置）

### 当前状态：✅ 可直接部署

所有必需的配置都已完成，项目可以直接部署使用！

### 安全优化建议：**1 项**（可选）

- ⚠️ 将生产环境的敏感信息迁移到 Cloudflare Secrets（提高安全性）

---

## 📞 常见问题

### Q: 为什么本地开发需要 `.dev.vars`？

A: Cloudflare Workers 本地开发环境需要 `.dev.vars` 文件来模拟生产环境的环境变量。

### Q: 如何查看当前配置的 Secrets？

A: 使用命令 `wrangler secret list`

### Q: 如何更新生产环境的 Secret？

A: 使用命令 `wrangler secret put SECRET_NAME`

### Q: 前端环境变量为什么以 `VITE_` 开头？

A: Vite 要求所有暴露给客户端的环境变量必须以 `VITE_` 开头，这是安全机制。

---

**最后更新**：2025-01-XX
**维护者**：TMarks Team
