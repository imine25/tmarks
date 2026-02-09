# Web 应用架构 (tmarks/)

## 整体架构

### 技术栈

#### 前端
- React 18
- TypeScript
- Vite 6
- TailwindCSS 4
- TanStack Query（数据管理）
- React Router 7（路由）
- Zustand（状态管理）
- i18next（国际化）

#### 后端
- Cloudflare Pages Functions
- Cloudflare D1（SQLite 数据库）
- Cloudflare KV（缓存）
- Cloudflare R2（对象存储）

## API 架构

### 路由结构

#### 认证模块 (/auth)
- POST /login - 用户登录
- POST /register - 用户注册
- POST /logout - 用户登出
- POST /refresh - 刷新 Token

#### 书签模块 (/bookmarks)
- GET / - 获取书签列表
- POST / - 创建书签
- PATCH /:id - 更新书签
- DELETE /:id - 软删除（移入回收站）
- PUT /:id - 恢复书签
- GET /trash - 获取回收站列表
- DELETE /trash/empty - 清空回收站
- POST /bulk - 批量操作
- GET /statistics - 统计数据
- POST /reorder-pinned - 批量更新置顶书签排序

#### 书签详情 (/bookmarks/:id)
- GET /snapshots - 获取快照列表
- POST /snapshots - 创建快照（V1，图片内联）
- POST /snapshots-v2 - 创建快照（V2，图片单独存储）
- DELETE /snapshots/:snapshotId - 删除快照
- POST /snapshots/cleanup - 批量清理快照
- PATCH /restore - 从回收站恢复
- DELETE /permanent - 永久删除
- POST /click - 记录点击（统计用）

#### 标签模块 (/tags)
- GET / - 获取标签列表
- POST / - 创建标签
- PATCH /:id - 更新标签
- DELETE /:id - 删除标签（级联删除关联）

#### 标签页组模块 (/tab-groups)
- GET / - 获取标签页组列表
- POST / - 创建标签页组
- PATCH /:id - 更新标签页组
- DELETE /:id - 删除标签页组
- GET /trash - 获取回收站列表
- POST /:id/restore - 恢复标签页组
- DELETE /:id/permanent-delete - 永久删除
- POST /:id/share - 创建分享链接
- GET /:id/share - 获取分享信息
- DELETE /:id/share - 删除分享
- POST /:id/items/batch - 批量添加标签页项

#### 标签页项模块 (/tab-groups/items)
- PATCH /:id - 更新标签页项
- DELETE /:id - 删除标签页项
- POST /:id/move - 移动标签页项到其他分组

#### 设置模块 (/settings)
- GET /api-keys - 获取 API Key 列表
- POST /api-keys - 创建 API Key
- GET /api-keys/:id - 获取 API Key 详情
- PATCH /api-keys/:id - 更新 API Key
- DELETE /api-keys/:id - 撤销 API Key
- GET /share - 获取分享设置
- PUT /share - 更新分享设置
- GET /storage - 获取存储配额信息
- POST /ai/test - 测试 AI 连接

#### NewTab 模块 (/tab/newtab)
- GET /sync - 获取所有 NewTab 数据（分组、快捷方式）
- POST /sync - 同步所有 NewTab 数据
- GET /groups - 获取分组列表
- POST /groups - 创建分组
- PATCH /groups/:id - 更新分组
- DELETE /groups/:id - 删除分组
- GET /shortcuts - 获取快捷方式列表
- POST /shortcuts - 创建快捷方式
- PATCH /shortcuts/:id - 更新快捷方式
- DELETE /shortcuts/:id - 删除快捷方式
- GET /folders - 获取文件夹列表
- POST /folders - 创建文件夹
- PATCH /folders/:id - 更新文件夹
- DELETE /folders/:id - 删除文件夹

#### 扩展专用 API (/tab)
- GET /me - 获取当前用户信息和统计
- GET /search - 全局搜索书签和标签
- GET /statistics - 获取标签页组统计（总数、趋势、热门域名、大小分布）
- GET /bookmarks - 获取书签列表（扩展专用）
- POST /bookmarks - 创建书签（扩展专用）
- GET /tags - 获取标签列表（扩展专用）
- POST /tags - 创建标签（扩展专用）
- GET /tab-groups - 获取标签页组列表（扩展专用）
- POST /tab-groups - 创建标签页组（扩展专用）
- GET /tab-groups/trash - 获取回收站列表（扩展专用）

#### 其他模块
- GET /preferences - 获取用户偏好
- PATCH /preferences - 更新用户偏好
- POST /change-password - 修改密码
- POST /import - 导入数据
- GET /import - 获取导入预览
- GET /export - 导出数据
- POST /export - 获取导出预览
- GET /health - 健康检查

### 中间件

#### 认证中间件 (requireAuth)
- JWT Token 验证
- API Key 验证
- 用户信息注入
- 权限检查

#### 安全中间件
- CORS 处理
- 安全头设置
- 请求日志
- 速率限制

## 数据库结构

### 核心表

#### 用户表 (users)
- id - 用户 ID
- email - 邮箱
- password_hash - 密码哈希
- name - 用户名
- created_at - 创建时间
- updated_at - 更新时间

#### 书签表 (bookmarks)
- id - 书签 ID
- user_id - 用户 ID
- url - 网址
- title - 标题
- description - 描述
- cover_image - 封面图
- favicon - 网站图标
- is_pinned - 是否置顶
- pin_order - 置顶排序
- is_archived - 是否归档
- is_trashed - 是否在回收站
- click_count - 点击次数
- last_clicked_at - 最后点击时间
- created_at - 创建时间
- updated_at - 更新时间

#### 标签表 (tags)
- id - 标签 ID
- user_id - 用户 ID
- name - 标签名
- color - 颜色
- created_at - 创建时间
- updated_at - 更新时间

#### 书签标签关联表 (bookmark_tags)
- bookmark_id - 书签 ID
- tag_id - 标签 ID

#### 快照表 (snapshots)
- id - 快照 ID
- bookmark_id - 书签 ID
- version - 版本号
- file_size - 文件大小
- content_hash - 内容哈希
- snapshot_title - 快照标题
- is_latest - 是否最新版本
- created_at - 创建时间

#### 快照图片表 (snapshot_images)
- id - 图片 ID
- snapshot_id - 快照 ID
- image_hash - 图片哈希
- image_type - 图片类型
- file_size - 文件大小
- created_at - 创建时间

#### 标签页组表 (tab_groups)
- id - 组 ID
- user_id - 用户 ID
- title - 标题
- parent_id - 父级 ID（文件夹）
- is_folder - 是否为文件夹
- position - 排序位置
- color - 颜色
- tags - 标签
- is_trashed - 是否在回收站
- created_at - 创建时间
- updated_at - 更新时间

#### 标签页项表 (tab_group_items)
- id - 项 ID
- group_id - 组 ID
- title - 标题
- url - 网址
- favicon - 图标
- position - 排序位置
- is_pinned - 是否置顶
- is_todo - 是否待办
- is_archived - 是否归档
- created_at - 创建时间
- updated_at - 更新时间

#### NewTab 相关表
- **newtab_groups** - NewTab 分组
  - id, user_id, name, icon, position
- **newtab_folders** - NewTab 文件夹
  - id, user_id, group_id, name, icon, position
- **newtab_shortcuts** - NewTab 快捷方式
  - id, user_id, group_id, folder_id, title, url, favicon, position, click_count
- **newtab_grid_items** - NewTab 网格项
  - id, user_id, group_id, type, size, position, config
- **newtab_settings** - NewTab 设置
  - user_id, columns, style, show_title, background_type, show_search, show_clock

#### API Keys 表 (api_keys)
- id - Key ID
- user_id - 用户 ID
- name - Key 名称
- key_hash - Key 哈希
- key_prefix - Key 前缀（显示用）
- permissions - 权限列表
- status - 状态（active/revoked）
- last_used_at - 最后使用时间
- last_used_ip - 最后使用 IP
- expires_at - 过期时间
- created_at - 创建时间

#### API Key 日志表 (api_key_logs)
- id - 日志 ID
- api_key_id - API Key ID
- user_id - 用户 ID
- endpoint - 请求端点
- method - 请求方法
- status - 响应状态码
- ip - 请求 IP
- created_at - 创建时间

#### 分享表 (shares)
- id - 分享 ID
- user_id - 用户 ID
- slug - 分享链接
- title - 标题
- description - 描述
- is_public - 是否公开
- password_hash - 密码哈希
- expires_at - 过期时间
- view_count - 访问次数
- created_at - 创建时间
- updated_at - 更新时间

#### 用户偏好表 (user_preferences)
- user_id - 用户 ID（主键）
- theme - 主题（light/dark/auto）
- page_size - 每页数量
- view_mode - 视图模式（list/card/minimal/title）
- density - 密度（normal/compact）
- tag_layout - 标签布局（grid/list）
- sort_by - 排序方式
- search_auto_clear_seconds - 搜索自动清除秒数
- tag_selection_auto_clear_seconds - 标签选择自动清除秒数

#### AI 设置表 (ai_settings)
- id - 设置 ID
- user_id - 用户 ID
- provider - AI 提供商
- api_key - API Key（加密存储）
- model - 模型名称
- temperature - 温度参数
- max_tokens - 最大 Token 数
- custom_prompt - 自定义 Prompt
- created_at - 创建时间
- updated_at - 更新时间

### 索引优化
- 用户 ID 索引
- URL 索引
- 标签名索引
- 创建时间索引
- 置顶排序索引
- 回收站状态索引

## 核心功能

### 书签管理
- CRUD 操作
- 标签关联
- 置顶/归档
- 置顶书签排序（拖拽排序）
- 回收站
- 批量操作
- 全局搜索（书签+标签）
- 统计分析
- 点击记录

### 标签管理
- 颜色自定义
- 使用统计
- 级联删除
- 批量编辑

### 快照系统
- 网页快照存储（R2）
- 图片单独存储
- 版本管理
- SHA-256 去重
- 配额限制（全局 7GB）
- 批量清理

### 标签页组
- OneTab 风格收纳
- 文件夹分组
- 拖拽排序
- 分享功能
- 回收站
- 统计分析（总数、趋势、热门域名、大小分布）

### NewTab 数据同步
- 分组管理（CRUD）
- 快捷方式管理（CRUD）
- 文件夹管理（CRUD）
- 全量同步（一次性同步所有数据）
- 增量更新（只同步变化的数据）
- 跨设备同步

### 认证系统
- JWT 认证
- Refresh Token
- API Key 管理
- API Key 日志记录
- 权限控制
- 双重认证（JWT + API Key）

### 用户信息
- 获取用户基本信息
- 获取用户统计（总书签数、置顶数、归档数、标签数）
- 用户偏好设置

### 全局搜索
- 搜索书签（标题、描述、URL）
- 搜索标签（名称）
- 结果排序（置顶优先、更新时间）
- 结果限制（最多 100 条）
- 返回书签关联的标签

### 统计分析

#### 标签页组统计
- **总数统计**
  - 活跃标签页组数量
  - 已删除标签页组数量
  - 标签页项目总数
  - 分享总数

- **趋势分析**
  - 标签页组创建趋势（按日期）
  - 标签页项目创建趋势（按日期）
  - 支持自定义天数（默认 30 天）

- **热门域名 Top 10**
  - 统计标签页项目的域名分布
  - 按数量降序排列
  - 自动提取域名

- **标签页组大小分布**
  - 0 个项目
  - 1-5 个项目
  - 6-10 个项目
  - 11-20 个项目
  - 21-50 个项目
  - 50+ 个项目

### 导入导出

#### 导入功能
- **支持格式**
  - HTML（浏览器标准导出格式）
  - JSON（TMarks 专用格式）
  
- **导入选项**
  - 跳过重复书签
  - 自动创建缺失标签
  - 保留原始时间戳
  - 文件夹转换为标签
  - 批量大小控制
  - 最大并发数控制

- **AI 智能整理**（可选）
  - 自动分析书签内容
  - 生成智能标签
  - 优化描述信息
  - 批量处理（每批 50 个）

- **导入流程**
  1. 上传文件并验证格式
  2. 解析书签数据
  3. 可选 AI 整理
  4. 预览导入结果
  5. 确认并批量导入
  6. 显示导入统计

#### 导出功能
- **支持格式**
  - JSON（推荐，包含完整元数据）
  - HTML（浏览器兼容格式）

- **导出选项**
  - 包含标签信息
  - 包含元数据
  - 格式化 JSON
  - 包含点击统计
  - 包含用户信息

- **导出统计**
  - 总书签数量
  - 总标签数量
  - 置顶书签数量
  - 预估文件大小

- **导出流程**
  1. 选择导出格式和选项
  2. 生成导出预览
  3. 确认导出
  4. 下载文件

## 前端架构

### 页面结构
- 登录/注册页
- 书签管理页
- 标签管理页
- 标签页组管理页
- 回收站页
- 统计分析页
- 设置页
- 导入导出页
- 公开分享页

### 状态管理
- TanStack Query（服务端状态）
- Zustand（客户端状态）
- React Context（主题、国际化）

### 数据缓存
- 30 分钟 staleTime
- 24 小时 gcTime
- 窗口聚焦时刷新
- 乐观更新
- 自动失效

### 性能优化
- 虚拟滚动
- 代码分割
- 图片懒加载
- 防抖节流
- 无限滚动

## 后端架构

### Cloudflare Pages Functions
- 边缘计算
- 全球分布
- 自动扩展
- 零配置部署

### 数据库优化
- 索引优化
- 批量操作
- 分页查询
- 连接池

### 缓存策略
- KV 缓存（公开分享）
- 浏览器缓存
- CDN 缓存

### 存储优化
- 快照去重
- 图片单独存储
- 配额限制
- 自动清理

## 安全机制

### 认证授权
- JWT Token
- Refresh Token
- API Key
- 权限控制

### 数据安全
- 密码哈希（bcrypt）
- API Key 哈希
- HTTPS 传输
- CORS 配置

### 速率限制
- 请求频率限制
- IP 限制
- 用户限制
- API Key 限制

### 输入验证
- 参数验证
- SQL 注入防护
- XSS 防护
- CSRF 防护
